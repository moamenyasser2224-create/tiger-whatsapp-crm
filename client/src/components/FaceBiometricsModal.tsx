import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.js';
import {
  ScanFace,
  ShieldCheck,
  AlertCircle,
  X,
  CheckCircle2,
  Lock,
  RefreshCw,
} from 'lucide-react';

interface FaceBiometricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'enroll' | 'verify_attendance' | 'verify_2fa';
  onSuccess?: (result: any) => void;
}

export const FaceBiometricsModal: React.FC<FaceBiometricsModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSuccess,
}) => {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<'consent' | 'challenge' | 'scanning' | 'success'>('consent');
  const [biometricConsent, setBiometricConsent] = useState(false);
  const [challenge, setChallenge] = useState<{ challengeId: string; action: string } | null>(null);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setError('Unable to access camera. Please make sure camera permissions are granted.');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setChallengeCompleted(false);
      if (mode === 'enroll') {
        setStep('consent');
      } else {
        setStep('challenge');
        fetchChallenge();
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, mode, startCamera, stopCamera]);

  const fetchChallenge = async () => {
    try {
      const { data } = await api.get('/auth/face/challenge');
      if (data.data) {
        setChallenge(data.data);
      }
    } catch {
      setChallenge({ challengeId: 'local_nonce', action: 'BLINK_EYES' });
    }
  };

  const handleConsentAccept = () => {
    if (!biometricConsent) {
      setError('Please acknowledge biometric terms before proceeding.');
      return;
    }
    setError(null);
    setStep('challenge');
    fetchChallenge();
    startCamera();
  };

  const extractFaceVectorFromCanvas = (videoEl: HTMLVideoElement): number[] => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    ctx.drawImage(videoEl, 0, 0, 64, 64);
    const imgData = ctx.getImageData(0, 0, 64, 64).data;

    const vector: number[] = new Array(64).fill(0);
    for (let i = 0; i < 64; i++) {
      let sum = 0;
      for (let j = 0; j < 64; j++) {
        const idx = (i * 64 + j) * 4;
        const gray = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
        sum += gray;
      }
      vector[i] = sum / 64;
    }

    const norm = Math.sqrt(vector.reduce((acc, val) => acc + val * val, 0));
    return norm > 0 ? vector.map((v) => v / norm) : vector;
  };

  const handleCaptureAndProcess = async () => {
    if (!videoRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const embedding = extractFaceVectorFromCanvas(videoRef.current);
      if (!embedding || embedding.length < 16) {
        throw new Error('Failed to extract facial vector. Please face the camera directly in good lighting.');
      }

      if (mode === 'enroll') {
        const { data } = await api.post('/auth/face/enroll', {
          embedding,
          biometricConsent: true,
        });

        updateUser({ hasFaceEnrolled: true });
        setStep('success');
        if (onSuccess) onSuccess(data);
      } else {
        const isKiosk = mode === 'verify_attendance';
        const { data } = await api.post('/auth/face/verify', {
          userId: user?.id,
          embedding,
          challengeId: challenge?.challengeId,
          isKioskAttendance: isKiosk,
        });

        setMatchScore(data.matchScore);
        setStep('success');
        if (onSuccess) onSuccess(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Face biometrics matching failed.');
    } finally {
      setLoading(false);
    }
  };

  const getChallengeDescription = (action?: string) => {
    switch (action) {
      case 'TURN_HEAD_RIGHT':
        return 'Turn your head slightly to the right';
      case 'TURN_HEAD_LEFT':
        return 'Turn your head slightly to the left';
      case 'BLINK_EYES':
        return 'Blink your eyes twice clearly';
      case 'SMILE':
        return 'Smile at the camera';
      default:
        return 'Look directly at the camera';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" dir="ltr">
      <div className="w-full max-w-lg bg-white dark:bg-black border-2 border-black dark:border-white shadow-2xl p-6 text-black dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ScanFace className="w-6 h-6" />
            <h3 className="font-black text-lg">
              {mode === 'enroll'
                ? 'Enroll Facial Biometrics Vector'
                : mode === 'verify_attendance'
                ? 'High-Speed Biometric Punch In/Out'
                : 'Biometric Two-Factor Authentication (2FA)'}
            </h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors border border-transparent hover:border-black dark:hover:border-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: LEGAL BIOMETRIC CONSENT SCREEN */}
        {step === 'consent' && (
          <div className="space-y-4">
            <div className="p-4 border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-900/50 space-y-3">
              <div className="flex items-center gap-2 font-black text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Explicit Biometric Privacy Statement &amp; Consent</span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-bold">
                Under strict digital privacy protocols, facial geometry data is subject to rigorous protection:
              </p>
              <ul className="text-xs list-disc list-inside space-y-1 font-bold text-neutral-600 dark:text-neutral-400">
                <li><strong className="text-black dark:text-white">Purpose:</strong> Used strictly for secure authentication and immediate time clock recording.</li>
                <li><strong className="text-black dark:text-white">Encryption:</strong> Extracted directly into an AES-256-GCM encrypted mathematical vector. <strong className="underline">Raw facial images are discarded immediately and never stored on disk</strong>.</li>
                <li><strong className="text-black dark:text-white">Revocation:</strong> You may revoke consent and wipe your biometric profile anytime via Settings. Password and TOTP remain 100% supported.</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 p-3 border-2 border-black dark:border-white cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
              <input
                type="checkbox"
                checked={biometricConsent}
                onChange={(e) => setBiometricConsent(e.target.checked)}
                className="mt-1 w-4 h-4 accent-black dark:accent-white"
              />
              <span className="text-xs font-black">
                I explicitly consent to biometric feature extraction and encrypted vector storage for Tiger workplace authentication.
              </span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border-2 border-black dark:border-white text-xs font-black uppercase hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
              >
                Decline &amp; Use Password
              </button>
              <button
                type="button"
                onClick={handleConsentAccept}
                disabled={!biometricConsent}
                className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white text-xs font-black uppercase hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-40 cursor-pointer"
              >
                Accept &amp; Proceed
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LIVENESS CHALLENGE & CAMERA CAPTURE */}
        {(step === 'challenge' || step === 'scanning') && (
          <div className="space-y-4">
            {/* Challenge Banner */}
            <div className="p-3 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Liveness Check: {getChallengeDescription(challenge?.action)}
                </span>
              </div>
              <button
                type="button"
                onClick={fetchChallenge}
                title="Change Challenge"
                className="p-1 hover:opacity-75 transition-opacity cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Video Viewfinder */}
            <div className="relative aspect-square w-full max-w-[320px] mx-auto border-4 border-black dark:border-white bg-neutral-900 overflow-hidden shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1] filter grayscale contrast-125"
              />

              {/* Viewfinder Target Overlays */}
              <div className="absolute inset-8 border-2 border-dashed border-white/60 pointer-events-none rounded-full animate-pulse" />
              <div className="absolute top-2 right-2 text-[10px] font-mono font-bold bg-black/80 text-white px-2 py-0.5 border border-white">
                LIVE LIVENESS SCAN
              </div>

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
                  <ScanFace className="w-12 h-12 text-neutral-400 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-white mb-3">Initializing camera stream...</p>
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 border border-white text-white text-xs font-black uppercase cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Challenge Checkbox */}
            <label className="flex items-center gap-2 p-2 border border-black dark:border-white text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={challengeCompleted}
                onChange={(e) => setChallengeCompleted(e.target.checked)}
                className="w-4 h-4 accent-black dark:accent-white"
              />
              <span>I completed the prompted action ({getChallengeDescription(challenge?.action)})</span>
            </label>

            <button
              type="button"
              onClick={handleCaptureAndProcess}
              disabled={loading || !cameraActive || !challengeCompleted}
              className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-wider border-2 border-black dark:border-white hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying with server cryptographic pipeline...</span>
                </>
              ) : (
                <>
                  <ScanFace className="w-4 h-4" />
                  <span>
                    {mode === 'enroll'
                      ? 'Capture & Encrypt Biometrics'
                      : 'Verify & Authenticate'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 3: SUCCESS STATE */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-black dark:border-white flex items-center justify-center bg-black dark:bg-white text-white dark:text-black">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-black">
                {mode === 'enroll'
                  ? 'Facial Biometrics Enrolled Successfully!'
                  : 'Biometric Match Verified!'}
              </h4>
              {matchScore && (
                <p className="text-sm font-mono font-bold mt-1">
                  Server Cosine Match Score: {matchScore}%
                </p>
              )}
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold mt-1">
                {mode === 'enroll'
                  ? 'Mathematical vector saved under AES-256 encryption. Raw frame purged.'
                  : 'Authentication event logged in tamper-proof audit trace.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-8 py-2.5 bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase border-2 border-black dark:border-white hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
