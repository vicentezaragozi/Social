"use client";

import { useState, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import { setupAdminProfileAction, type AdminProfileSetupState } from "@/app/(auth)/sign-in/admin/onboarding/actions";
import { getCroppedDataUrl, type PixelCrop } from "@/lib/image";

type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

type ProfileDraft = {
  displayName: string;
  bio: string;
  avatarPreview: string | null;
  avatarCroppedDataUrl: string | null;
  avatarFileName: string | null;
};

type AdminProfileStepProps = {
  profile: Profile;
  draft: ProfileDraft;
  onDraftChange: (updates: Partial<ProfileDraft>) => void;
  onComplete?: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
};

const initialState: AdminProfileSetupState = {};
const AVATAR_ASPECT = 1;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-gradient-to-r from-[#ff6b9d] to-[#c33764] px-8 py-4 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Completing Setup..." : "Complete Setup & Go to Dashboard"}
    </button>
  );
}

export function AdminProfileStep({
  profile,
  draft,
  onDraftChange,
  onComplete,
  onBack,
  canGoBack,
}: AdminProfileStepProps) {
  const [state, formAction] = useActionState(setupAdminProfileAction, initialState);
  
  // Call onComplete when successful
  useEffect(() => {
    if (state.success && onComplete) {
      onComplete();
    }
  }, [state.success, onComplete]);
  const [avatarRawImage, setAvatarRawImage] = useState<string | null>(null);
  const [pendingAvatarFileName, setPendingAvatarFileName] = useState<string | null>(null);
  const [isAvatarCropOpen, setIsAvatarCropOpen] = useState(false);
  const [avatarCrop, setAvatarCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarCroppedAreaPixels, setAvatarCroppedAreaPixels] = useState<PixelCrop | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

    setPendingAvatarFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarRawImage(reader.result as string);
      setIsAvatarCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const onAvatarCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setAvatarCroppedAreaPixels(croppedAreaPixels);
  };

  const handleAvatarCropSave = async () => {
    if (!avatarRawImage || !avatarCroppedAreaPixels) return;

    try {
      const croppedDataUrl = await getCroppedDataUrl(avatarRawImage, avatarCroppedAreaPixels);
      onDraftChange({
        avatarPreview: croppedDataUrl,
        avatarCroppedDataUrl: croppedDataUrl,
        avatarFileName: pendingAvatarFileName ?? draft.avatarFileName,
      });
      setIsAvatarCropOpen(false);
      setAvatarRawImage(null);
      setPendingAvatarFileName(null);
    } catch (error) {
      console.error("Crop error:", error);
      alert("Failed to crop image. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="mb-3 text-4xl font-bold text-white">Almost There! 👤</h1>
        <p className="text-lg text-[var(--muted)]">
          Set up your admin profile. This is also your guest profile if you appear in the feed.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0f1629]/80 p-8 backdrop-blur">
        <form action={formAction} className="space-y-6">
          {/* Avatar */}
          <div className="space-y-4">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Profile Photo *
            </label>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white/10 bg-[#0a1024]">
                {draft.avatarPreview ?? profile.avatar_url ? (
                  <Image
                    src={(draft.avatarPreview ?? profile.avatar_url) as string}
                    alt="Avatar preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">👤</div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  required={!profile.avatar_url && !draft.avatarPreview}
                  onChange={handleAvatarChange}
                  className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white file:mr-4 file:rounded-xl file:border-0 file:bg-[#1a2a4a] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#6b9eff] hover:file:bg-[#243556]"
                />
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Square photo recommended. Max 5MB.
                </p>
                <p className="mt-1 text-xs text-white/70">
                  {draft.avatarFileName ?? (profile.avatar_url ? "Existing photo" : "No file chosen")}
                </p>
              </div>
            </div>
            {draft.avatarCroppedDataUrl && (
              <input type="hidden" name="avatarCropped" value={draft.avatarCroppedDataUrl} />
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Display Name *
            </label>
            <input
              type="text"
              name="displayName"
              required
              value={draft.displayName}
              onChange={(event) => onDraftChange({ displayName: event.target.value })}
              placeholder="How should guests see you?"
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Bio (Optional)
            </label>
            <textarea
              name="bio"
              rows={3}
              value={draft.bio}
              onChange={(event) => onDraftChange({ bio: event.target.value })}
              placeholder="Tell guests a bit about yourself..."
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          {state.error && (
            <div className="rounded-2xl border border-[#5c2a40] bg-[#301321] px-4 py-3 text-sm text-[#ff8ba7]">
              {state.error}
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            {canGoBack && onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="rounded-2xl border border-white/10 px-6 py-4 font-semibold text-white transition-colors hover:bg-white/5"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}
            <SubmitButton />
          </div>
        </form>
      </div>

      {/* Crop Modal */}
      {isAvatarCropOpen && avatarRawImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-xl space-y-4">
            <div className="relative aspect-square w-full max-h-[60vh] overflow-hidden rounded-2xl">
              <Cropper
                image={avatarRawImage}
                crop={avatarCrop}
                zoom={avatarZoom}
                aspect={AVATAR_ASPECT}
                onCropChange={setAvatarCrop}
                onZoomChange={setAvatarZoom}
                onCropComplete={onAvatarCropComplete}
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-[var(--muted)]">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={avatarZoom}
                  onChange={(e) => setAvatarZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAvatarCropOpen(false);
                    setAvatarRawImage(null);
                    setPendingAvatarFileName(null);
                  }}
                  className="flex-1 rounded-2xl border border-white/10 bg-[#0a1024] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0f1629]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAvatarCropSave}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-[#6b9eff] to-[#4a7fd9] px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

