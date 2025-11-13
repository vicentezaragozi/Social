"use client";

import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import { useActionState, useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n";

import { completeOnboarding, type OnboardingState } from "@/app/[locale]/(guest)/onboarding/actions";
import { getCroppedDataUrl, type PixelCrop } from "@/lib/image";
import { cn } from "@/lib/utils";
import { useFormStatePreservation } from "@/hooks/use-form-state-preservation";

const CROPPER_ASPECT = 3 / 4;
const AVATAR_ASPECT = 1;
const CONNECT_COACHMARK_KEY = "social:connect-coachmark-dismissed";
const CONNECT_TOOLTIP_KEY = "social:connect-tooltip-seen";

type OnboardingDefaults = {
  display_name?: string;
  age?: number;
  is_private?: boolean;
  bio?: string;
  avatar_url?: string | null;
  highlight_tags?: string[];
  favorite_track_url?: string | null;
  email?: string | null;
};

const initialState: OnboardingState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("auth.onboarding.form");

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]",
        "disabled:cursor-not-allowed disabled:bg-[#2c2a42] disabled:text-[var(--muted)]",
      )}
    >
      <span className="relative z-10">
        {pending ? t("saving") : t("save")}
      </span>
      <div className="absolute inset-0 translate-y-full bg-[var(--accent-strong)] transition group-hover:translate-y-0" />
    </button>
  );
}

export function OnboardingForm({ defaultValues }: { defaultValues: OnboardingDefaults }) {
  const router = useRouter();
  const locale = useLocale();
  const [state, formAction] = useActionState(completeOnboarding, initialState);
  const t = useTranslations("auth.onboarding.form");
  const tAlerts = useTranslations("auth.onboarding.alerts");
  const tCrop = useTranslations("auth.onboarding.crop");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(defaultValues.avatar_url ?? null);
  const [avatarRawImage, setAvatarRawImage] = useState<string | null>(null);
  const [avatarCroppedImage, setAvatarCroppedImage] = useState<string | null>(null);
  const [isAvatarCropOpen, setIsAvatarCropOpen] = useState(false);
  const [avatarCrop, setAvatarCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarCroppedAreaPixels, setAvatarCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(defaultValues.highlight_tags ?? []);
  const formRef = useRef<HTMLFormElement>(null);

  // Form state preservation across locale changes
  const controlledState = {
    previewUrl,
    fileName,
    rawImage,
    croppedImage,
    avatarPreview,
    avatarRawImage,
    avatarCroppedImage,
    galleryPreviews,
    tags,
    tagInput,
  };
  
  const { clearSavedState } = useFormStatePreservation<typeof controlledState>(
    "onboarding-form",
    controlledState,
    null,
    {
      formRef,
      onRestore: (restored: typeof controlledState) => {
        if (restored.previewUrl !== undefined) setPreviewUrl(restored.previewUrl);
        if (restored.fileName !== undefined) setFileName(restored.fileName);
        if (restored.rawImage !== undefined) setRawImage(restored.rawImage);
        if (restored.croppedImage !== undefined) setCroppedImage(restored.croppedImage);
        if (restored.avatarPreview !== undefined) setAvatarPreview(restored.avatarPreview);
        if (restored.avatarRawImage !== undefined) setAvatarRawImage(restored.avatarRawImage);
        if (restored.avatarCroppedImage !== undefined) setAvatarCroppedImage(restored.avatarCroppedImage);
        if (restored.galleryPreviews !== undefined) setGalleryPreviews(restored.galleryPreviews);
        if (restored.tags !== undefined) setTags(restored.tags);
        if (restored.tagInput !== undefined) setTagInput(restored.tagInput);
      },
    }
  );

  useEffect(
    () => () => {
      galleryPreviews.forEach((url) => URL.revokeObjectURL(url));
    },
    [galleryPreviews],
  );

  useEffect(() => {
    if (!state.success) return;
    if (typeof window === "undefined") return;
    
    // Clear saved form state on successful submission
    clearSavedState();
    
    // Small delay to ensure locale is available
    const redirectTimer = setTimeout(() => {
      window.localStorage.removeItem(CONNECT_COACHMARK_KEY);
      window.localStorage.removeItem(CONNECT_TOOLTIP_KEY);
      
      // Get locale from useLocale hook (most reliable)
      const hookLocale = locale;
      
      // Also extract from pathname as backup
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(Boolean);
      const pathLocale = pathParts[0];
      
      // Determine valid locale with strict validation
      let validLocale: string = 'en'; // Default fallback
      
      // Priority 1: Hook locale
      if (hookLocale && typeof hookLocale === 'string' && ['en', 'es'].includes(hookLocale)) {
        validLocale = hookLocale;
      }
      // Priority 2: Pathname locale
      else if (pathLocale && typeof pathLocale === 'string' && ['en', 'es'].includes(pathLocale)) {
        validLocale = pathLocale;
      }
      // Priority 3: Default to 'en'
      else {
        validLocale = 'en';
      }
      
      // Final safety check - ensure it's never undefined or invalid
      if (!validLocale || typeof validLocale !== 'string' || validLocale === 'undefined' || !['en', 'es'].includes(validLocale)) {
        validLocale = 'en';
      }
      
      // Use window.location for full page navigation
      window.location.href = `/${validLocale}/app`;
    }, 100); // Small delay to ensure React has finished rendering
    
    return () => clearTimeout(redirectTimer);
  }, [state.success, locale, clearSavedState]);

  const handleFileChange = (file: File | undefined) => {
    if (!file) {
      setPreviewUrl(null);
      setFileName(null);
      setRawImage(null);
      setCroppedImage(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(tAlerts("fileTooLarge"));
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setRawImage(result);
      setPreviewUrl(result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (_: Area, croppedPixels: PixelCrop) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleUsePhoto = async () => {
    if (!rawImage || !croppedAreaPixels) {
      setIsCropModalOpen(false);
      return;
    }

    const mimeMatch = rawImage.match(/^data:([^;]+)/);
    const mime = (mimeMatch?.[1] as "image/jpeg" | "image/png" | "image/webp") ?? "image/jpeg";
    const dataUrl = await getCroppedDataUrl(rawImage, croppedAreaPixels, mime);
    setCroppedImage(dataUrl);
    setPreviewUrl(dataUrl);
    setIsCropModalOpen(false);
  };

  const handleAvatarFileChange = (file: File | undefined) => {
    if (!file) {
      setAvatarPreview(null);
      setAvatarRawImage(null);
      setAvatarCroppedImage(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload an image smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarRawImage(result);
      setAvatarPreview(result);
      setAvatarCroppedImage(null);
      setAvatarCroppedAreaPixels(null);
      setAvatarCrop({ x: 0, y: 0 });
      setAvatarZoom(1);
      setIsAvatarCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarCropComplete = (_: Area, croppedPixels: PixelCrop) => {
    setAvatarCroppedAreaPixels(croppedPixels);
  };

  const handleAvatarUsePhoto = async () => {
    if (!avatarRawImage || !avatarCroppedAreaPixels) {
      setIsAvatarCropOpen(false);
      return;
    }

    const mimeMatch = avatarRawImage.match(/^data:([^;]+)/);
    const mime = (mimeMatch?.[1] as "image/jpeg" | "image/png" | "image/webp") ?? "image/jpeg";
    const dataUrl = await getCroppedDataUrl(avatarRawImage, avatarCroppedAreaPixels, mime);
    setAvatarCroppedImage(dataUrl);
    setAvatarPreview(dataUrl);
    setIsAvatarCropOpen(false);
  };

  const handleGalleryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    galleryPreviews.forEach((url) => URL.revokeObjectURL(url));
    if (!files || files.length === 0) {
      setGalleryPreviews([]);
      return;
    }
    if (files.length > 4) {
      alert(tAlerts("maxGallery"));
      event.target.value = "";
      setGalleryPreviews([]);
      return;
    }
    
    // Check file sizes
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = Array.from(files).filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert(tAlerts("filesTooLarge", { count: oversizedFiles.length }));
      event.target.value = "";
      setGalleryPreviews([]);
      return;
    }
    
    const previews = Array.from(files).map((file) => URL.createObjectURL(file));
    setGalleryPreviews(previews);
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    const normalized = value.startsWith("#") ? value : `#${value}`;
    if (tags.length >= 5) {
      alert(tAlerts("maxTags"));
      return;
    }
    if (tags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
      setTagInput("");
      return;
    }
    setTags((current) => [...current, normalized.slice(0, 32)]);
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags((current) => current.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    }
    if (event.key === "Backspace" && tagInput.length === 0 && tags.length) {
      event.preventDefault();
      setTags((current) => current.slice(0, -1));
    }
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-[32px] border border-[#1d2946] bg-[var(--surface)]/85 p-5 shadow-xl shadow-black/30 backdrop-blur sm:p-6"
    >
      <input type="hidden" name="cropped_id_photo" value={croppedImage ?? ""} />
      <input type="hidden" name="cropped_avatar" value={avatarCroppedImage ?? ""} />
      <input type="hidden" name="highlight_tags" value={JSON.stringify(tags)} />
      <input type="hidden" name="existing_avatar" value={defaultValues.avatar_url ?? ""} />
      <input type="hidden" name="remove_avatar" value={avatarPreview ? "0" : "1"} />

      <div className="space-y-4">
        <div>
          <label
            htmlFor="display_name"
            className="block text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]"
          >
            {t("displayName")}
          </label>
          <input
            id="display_name"
            name="display_name"
            required
            defaultValue={defaultValues.display_name}
            placeholder={t("displayNamePlaceholder")}
            className="mt-2 w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 sm:text-base"
          />
        </div>
        <div>
          <label
            htmlFor="age"
            className="block text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]"
          >
            {t("age")}
          </label>
          <input
            id="age"
            name="age"
            type="number"
            min={18}
            required
            defaultValue={defaultValues.age}
            placeholder={t("agePlaceholder")}
            className="mt-2 w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 sm:text-base"
          />
        </div>
        <div>
          <label
            htmlFor="phone_number"
            className="block text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]"
          >
            {t("phoneNumber")} <span className="text-xs normal-case tracking-normal">{t("phoneOptional")}</span>
          </label>
          <input
            id="phone_number"
            name="phone_number"
            type="tel"
            placeholder={t("phonePlaceholder")}
            className="mt-2 w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 sm:text-base"
          />
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            {t("phoneHelp")}
          </p>
        </div>
        <div>
          <label
            htmlFor="bio"
            className="block text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]"
          >
            {t("bio")}
          </label>
          <textarea
            id="bio"
            name="bio"
            maxLength={240}
            rows={3}
            defaultValue={defaultValues.bio ?? ""}
            placeholder={t("bioPlaceholder")}
            className="mt-2 w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-[#223253] bg-[#101b33] p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-[#2f3c62] bg-[#121b2b]">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Profile preview"
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-[#9db3ff]">🙂</div>
            )}
          </div>
          <div className="flex-1 space-y-2 text-xs text-[var(--muted)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8796c6]">
              {t("profilePhoto")}
            </p>
            <p>{t("profilePhotoDescription")}</p>
            <div className="flex flex-wrap gap-2">
              <label
                htmlFor="avatar"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#2f3c62] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9db3ff] transition hover:border-[#9db3ff] hover:text-white"
              >
                {t("uploadPhoto")}
                <input
                  id="avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => handleAvatarFileChange(event.target.files?.[0])}
                />
              </label>
              {avatarPreview ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (avatarPreview) {
                        setAvatarRawImage(avatarPreview);
                        setAvatarCroppedAreaPixels(null);
                        setAvatarCrop({ x: 0, y: 0 });
                        setAvatarZoom(1);
                        setIsAvatarCropOpen(true);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[#2f9b7a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ef1b5] transition hover:border-[#5ef1b5] hover:text-white"
                  >
                    {t("adjust")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarPreview(null);
                      setAvatarRawImage(null);
                      setAvatarCroppedImage(null);
                      setAvatarCroppedAreaPixels(null);
                      setAvatarCrop({ x: 0, y: 0 });
                      setAvatarZoom(1);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[#553432] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff8ba7] transition hover:border-[#ff8ba7] hover:text-white"
                  >
                    {t("remove")}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            {t("idPhoto")}
          </span>
          <p className="text-xs text-[var(--muted)]">
            {t("idPhotoDescription")}
          </p>
        </div>
        <label
          htmlFor="id_photo"
          className="relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#2e3a5d] bg-[#0a1020] px-5 py-8 text-center transition hover:border-[var(--accent)] hover:bg-[#121b33]"
        >
          {previewUrl ? (
            <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-[#1d2946]">
              <Image
                src={previewUrl}
                alt="ID upload preview"
                fill
                unoptimized
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#2f3c62] bg-[#121b2b] text-[var(--accent)]">
              📸
            </div>
          )}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              {fileName ?? t("tapToUpload")}
            </p>
            <p className="text-xs text-[var(--muted)]">{t("idPhotoHelp")}</p>
          </div>
          <input
            id="id_photo"
            name="id_photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required={!croppedImage}
            className="sr-only"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <span className="rounded-full border border-[#223253] px-3 py-1">
            {t("idPhotoTips")}
          </span>
          {previewUrl ? (
            <button
              type="button"
              onClick={() => {
                if (previewUrl) {
                  setRawImage(previewUrl);
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                  setCroppedAreaPixels(null);
                  setIsCropModalOpen(true);
                }
              }}
              className="rounded-full border border-[#2f9b7a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ef1b5]"
            >
              {t("adjustPhoto")}
            </button>
          ) : null}
          {previewUrl ? (
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                setFileName(null);
                setRawImage(null);
                setCroppedImage(null);
              }}
              className="rounded-full border border-[#553432] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff8ba7]"
            >
              {t("remove")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            {t("galleryPhotos")}
          </span>
          <p className="text-xs text-[var(--muted)]">
            {t("galleryDescription")}
          </p>
        </div>
        <label
          htmlFor="gallery_photos"
          className="relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#2e3a5d] bg-[#0a1020] px-5 py-6 text-center transition hover:border-[var(--accent)] hover:bg-[#121b33]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2f3c62] bg-[#121b2b] text-xl text-[var(--accent)]">
            📷
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              {galleryPreviews.length
                ? t("selectedPhotos", { count: galleryPreviews.length, plural: galleryPreviews.length > 1 ? "s" : "" })
                : t("tapToAdd")}
            </p>
            <p className="text-xs text-[var(--muted)]">{t("galleryHelp")}</p>
          </div>
          <input
            id="gallery_photos"
            name="gallery_photos"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="sr-only"
            onChange={handleGalleryChange}
          />
        </label>
        {galleryPreviews.length ? (
          <div className="grid grid-cols-2 gap-3">
            {galleryPreviews.map((url, index) => (
              <div
                key={url}
                className="relative h-28 overflow-hidden rounded-2xl border border-[#1d2946]"
              >
                <Image src={url} alt={`Gallery preview ${index + 1}`} fill sizes="50vw" className="object-cover" />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 rounded-3xl border border-[#1d2946] bg-[#0b1224] p-4">
        <label className="text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          {t("highlights")}
        </label>
        <p className="text-xs text-[var(--muted)]">
          {t("highlightsDescription")}
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 rounded-full border border-[#2c3c65] bg-[#111a33] px-3 py-1 text-xs font-semibold text-[#9db3ff]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-[var(--muted)] transition hover:text-white"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={tags.length ? t("addAnotherTag") : t("tagPlaceholder")}
            className="flex-1 min-w-[140px] rounded-full border border-dashed border-[#2e3a5d] bg-transparent px-4 py-2 text-sm text-white outline-none transition focus:border-[var(--accent)]"
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-full border border-[#2f9b7a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ef1b5] transition hover:border-[#5ef1b5] hover:text-white"
          >
            {t("addTag")}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="favorite_track_url"
          className="text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]"
        >
          {t("favoriteTrack")}
        </label>
        <input
          id="favorite_track_url"
          name="favorite_track_url"
          type="url"
          defaultValue={defaultValues.favorite_track_url ?? ""}
          placeholder={t("favoriteTrackPlaceholder")}
          className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
        <p className="text-xs text-[var(--muted)]">{t("favoriteTrackHelp")}</p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-[#1d2946] bg-[#0b1224] p-4">
        <input
          id="is_private"
          name="is_private"
          type="checkbox"
          defaultChecked={defaultValues.is_private}
          className="mt-1 h-4 w-4 rounded border border-[#2b3a63] bg-transparent text-[var(--accent)] focus:ring-[var(--accent)]"
        />
        <label htmlFor="is_private" className="space-y-1 text-sm text-white">
          <span className="flex items-center gap-2 font-medium">
            {t("privateMode")}
          </span>
          <p className="text-xs text-[var(--muted)]">
            {t("privateDescription")}
          </p>
        </label>
      </div>

      <div className="rounded-2xl border border-[#1d2946] bg-[#0b1224] p-4 text-xs text-[var(--muted)]">
        <p>
          {t("magicLinkEmails", { email: defaultValues.email ?? "your email" })}
        </p>
      </div>

      <div className="space-y-3">
        <SubmitButton />
        {state.error ? (
          <p className="rounded-2xl border border-[#5c2a40] bg-[#301321] px-4 py-2 text-xs text-[#ff8ba7]">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="rounded-2xl border border-[#264b3f] bg-[#122521] px-4 py-2 text-xs text-[#5ef1b5]">
            {t("success")}
          </p>
        ) : null}
      </div>

      {isCropModalOpen && rawImage ? (
        <CropModal
          image={rawImage}
          crop={crop}
          zoom={zoom}
          aspect={CROPPER_ASPECT}
          title={t("adjustPhoto")}
          helperText="Pinch or slide to zoom, then drag to center the document."
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          onClose={() => setIsCropModalOpen(false)}
          onConfirm={handleUsePhoto}
        />
      ) : null}

      {isAvatarCropOpen && avatarRawImage ? (
        <CropModal
          image={avatarRawImage}
          crop={avatarCrop}
          zoom={avatarZoom}
          aspect={AVATAR_ASPECT}
          title={t("adjust")}
          helperText="Keep your face centered for the best look."
          onCropChange={setAvatarCrop}
          onZoomChange={setAvatarZoom}
          onCropComplete={handleAvatarCropComplete}
          onClose={() => setIsAvatarCropOpen(false)}
          onConfirm={handleAvatarUsePhoto}
        />
      ) : null}
    </form>
  );
}

type CropModalProps = {
  image: string;
  crop: { x: number; y: number };
  zoom: number;
  aspect: number;
  title: string;
  helperText?: string;
  confirmLabel?: string;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: PixelCrop) => void;
  onClose: () => void;
  onConfirm: () => void;
};

function CropModal({
  image,
  crop,
  zoom,
  aspect,
  title,
  helperText,
  confirmLabel,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onClose,
  onConfirm,
}: CropModalProps) {
  const t = useTranslations("auth.onboarding.crop");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="relative w-full max-w-md rounded-3xl border border-[#223253] bg-[#0a1020] p-6 text-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
        <h2 className="text-lg font-semibold">{title}</h2>
        {helperText ? (
          <p className="mt-1 text-xs text-[var(--muted)]">{helperText}</p>
        ) : null}
        <div className="relative mt-5 h-72 overflow-hidden rounded-3xl border border-[#1d2946] bg-black">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="mt-5">
          <label className="text-xs text-[var(--muted)]">{t("zoom")}</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(event) => onZoomChange(Number(event.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#553432] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff8ba7]"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-[#2f9b7a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ef1b5]"
          >
            {confirmLabel ?? t("apply")}
          </button>
        </div>
      </div>
    </div>
  );
}

