import React, { useState, useRef } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.js';
import { Camera, Upload, X, Check, AlertCircle } from 'lucide-react';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large (Maximum 5MB)');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = Math.min(img.width, img.height);
        canvas.width = 256;
        canvas.height = 256;

        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        if (ctx) {
          ctx.drawImage(img, startX, startY, size, size, 0, 0, 256, 256);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoPreview(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!photoPreview) {
      setError('Please choose a photo first');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/users/profile-photo', {
        photoUrl: photoPreview,
      });

      updateUser({ photoUrl: data.photoUrl });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" dir="ltr">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-lg p-6 text-text">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg border border-border bg-bg text-muted">
              <Camera className="w-4 h-4" />
            </span>
            <h3 className="font-semibold text-base text-text">Update Profile Photo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border border-border hover:bg-bg text-muted hover:text-text cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-danger/30 bg-danger-soft text-danger text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col items-center justify-center my-6">
          <div className="w-28 h-28 rounded-full border border-border overflow-hidden bg-bg flex items-center justify-center mb-4 relative shadow-sm">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-muted">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-border bg-bg hover:bg-card text-xs font-medium text-text transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-muted" />
            <span>Choose Image</span>
          </button>
        </div>

        <div className="flex gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-border text-xs font-medium text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !photoPreview}
            className="flex-1 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {success ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved</span>
              </>
            ) : loading ? (
              <span>Saving...</span>
            ) : (
              <span>Save Photo</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
