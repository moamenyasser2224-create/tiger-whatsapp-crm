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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir="ltr">
      <div className="w-full max-w-sm bg-white dark:bg-black border-2 border-black dark:border-white shadow-2xl p-6 text-black dark:text-white">
        <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h3 className="font-black text-lg">Update Profile Photo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors border border-transparent hover:border-black dark:hover:border-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col items-center justify-center my-6">
          <div className="w-32 h-32 rounded-full border-4 border-black dark:border-white overflow-hidden bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4 relative shadow-inner">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile preview"
                className="w-full h-full object-cover grayscale"
              />
            ) : (
              <span className="text-3xl font-black text-neutral-400">
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
            className="flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white bg-white dark:bg-black text-xs font-black uppercase hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Choose Image</span>
          </button>
        </div>

        <div className="flex gap-2 border-t-2 border-black dark:border-white pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border-2 border-black dark:border-white text-xs font-black uppercase hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !photoPreview}
            className="flex-1 py-2 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white text-xs font-black uppercase hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
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
