"use client";

import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import { useActionState, useEffect, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import {
  updateProfileAction,
  type ProfileUpdateState,
} from "@/app/[locale]/(app)/profile/actions";
import { getCroppedDataUrl, type PixelCrop } from "@/lib/image";
import { cn } from "@/lib/utils";

const initialState: ProfileUpdateState = {};
const AVATAR_ASPECT = 1;

export function ProfileForm({
  defaultValues,
  email,
}: {
  defaultValues: {
    display_name: string;
    phone_number?: string | null;
    bio: string | null;
    is_private: boolean;
    avatar_url: string | null;
    highlight_tags: string[];
    gallery_urls: string[];
    favorite_track_url: string | null;
  };
  email: string;
}) {
  const t = useTranslations("app.profile.form");
  const tAlerts = useTranslations("app.profile.alerts");
  const tCrop = useTranslations("app.profile.crop");
  const [state, formAction] = useActionState(updateProfileAction, initialState);
  const [tags, setTags] = useState<string[]>(defaultValues.highlight_tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [gallery, setGallery] = useState<string[]>(defaultValues.gallery_urls ?? []);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(defaultValues.avatar_url ?? null);
  const [avatarRawImage, setAvatarRawImage] = useState<string | null>(null);
  const [avatarCroppedImage, setAvatarCroppedImage] = useState<string | null>(null);
  const [isAvatarCropOpen, setIsAvatarCropOpen] = useState(false);
  const [avatarCrop, setAvatarCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarCroppedAreaPixels, setAvatarCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [galleryImageErrors, setGalleryImageErrors] = useState<Record<string, boolean>>({});

  useEffect(
    () => () => {
      newGalleryPreviews.forEach((url) => URL.revokeObjectURL(url));
    },
    [newGalleryPreviews],
  );

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

  const removeTag = (target: string) => {
    setTags((current) => current.filter((tag) => tag !== target));
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

  const handleAvatarFileChange = (file: File | undefined) => {
    if (!file) {
      setAvatarPreview(null);
      setAvatarRawImage(null);
      setAvatarCroppedImage(null);
      setAvatarCroppedAreaPixels(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(tAlerts("fileTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarRawImage(result);
      setAvatarPreview(result);
      setAvatarCrop({ x: 0, y: 0 });
      setAvatarZoom(1);
      setAvatarCroppedAreaPixels(null);
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

  const handleNewGalleryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    newGalleryPreviews.forEach((url) => URL.revokeObjectURL(url));
    if (!files || files.length === 0) {
      setNewGalleryPreviews([]);
      return;
    }
    if (files.length + gallery.length > 4) {
      alert(tAlerts("maxGallery"));
      event.target.value = "";
      setNewGalleryPreviews([]);
      return;
    }
    
    // Check file sizes
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = Array.from(files).filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert(tAlerts("filesTooLarge", { count: oversizedFiles.length }));
      event.target.value = "";
      setNewGalleryPreviews([]);
      return;
    }
    
    const previews = Array.from(files).map((file) => URL.createObjectURL(file));
    setNewGalleryPreviews(previews);
  };

  const removeExistingImage = (url: string) => {
    setGallery((current) => current.filter((entry) => entry !== url));
  };

  return (
    <>
    <form
      action={formAction}
      className="space-y-6 rounded-3xl border border-[#223253] bg-[#0d162a] p-6 shadow-lg shadow-black/25"
    >
      <input type="hidden" name="cropped_avatar" value={avatarCroppedImage ?? ""} />
      <input type="hidden" name="existing_avatar" value={defaultValues.avatar_url ?? ""} />
      <input type="hidden" name="remove_avatar" value={avatarPreview ? "0" : "1"} />
      <input type="hidden" name="highlight_tags" value={JSON.stringify(tags)} />
      <input type="hidden" name="existing_gallery" value={JSON.stringify(gallery)} />

      <div className="space-y-4 rounded-3xl border border-[#223253] bg-[#101b33] p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-[#2f3c62] bg-[#121b2b]">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Profile avatar preview"
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8796c6]">
              {t("profilePhoto")}
            </p>
            <p>{t("profilePhotoDescription")}</p>
            <div className="flex flex-wrap gap-2">
              <label
                htmlFor="avatar_upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#2f3c62] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9db3ff] transition hover:border-[#9db3ff] hover:text-white"
              >
                {t("uploadPhoto")}
                <input
                  id="avatar_upload"
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

      <div className="space-y-2">
        <label
          htmlFor="display_name"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]"
        >
          {t("displayName")}
        </label>
        <input
          id="display_name"
          name="display_name"
          required
          defaultValue={defaultValues.display_name}
          className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="phone_number"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]"
        >
          {t("phoneNumber")}
        </label>
        <input
          id="phone_number"
          name="phone_number"
          type="tel"
          placeholder="+1234567890"
          defaultValue={defaultValues.phone_number ?? ""}
          className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
        <p className="text-xs text-[var(--muted)]">
          {t("phoneHelp")}
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="bio"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]"
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
          className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
        <p className="text-xs text-[var(--muted)]">{t("bioHelp")}</p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            {t("galleryPhotos")}
          </span>
          <p className="text-xs text-[var(--muted)]">
            {t("galleryDescription")}
          </p>
        </div>
        {gallery.length ? (
          <div className="grid grid-cols-3 gap-2">
            {gallery.map((url) => (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-xl border border-[#233050] bg-[#101b33]"
              >
                {!galleryImageErrors[url] ? (
                  <Image 
                    src={url} 
                    alt="Gallery photo" 
                    fill 
                    sizes="33vw" 
                    className="object-cover"
                    unoptimized
                    onError={() => setGalleryImageErrors(prev => ({ ...prev, [url]: true }))}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-[var(--muted)]">
                    🖼️
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeExistingImage(url)}
                  className="absolute inset-0 flex items-center justify-center bg-[#301321]/95 opacity-0 backdrop-blur transition group-hover:opacity-100"
                >
                  <span className="rounded-full border border-[#553432] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff8ba7]">
                    {t("remove")}
                  </span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#2e3a5d] bg-[#101b33] p-6 text-center text-sm text-[var(--muted)]">
            <div className="mb-2 text-3xl">📸</div>
            {t("noGalleryPhotos")}
          </div>
        )}
        <label
          htmlFor="gallery_photos"
          className="relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#2e3a5d] bg-[#101b33] px-5 py-6 text-center transition hover:border-[var(--accent)] hover:bg-[#121f3c]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2f3c62] bg-[#121b2b] text-xl text-[var(--accent)]">
            📷
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              {newGalleryPreviews.length
                ? t("queuedPhotos", { count: newGalleryPreviews.length, plural: newGalleryPreviews.length > 1 ? "s" : "" })
                : t("tapToAdd")}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {t("galleryHelp")}
            </p>
          </div>
          <input
            id="gallery_photos"
            name="gallery_photos"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="sr-only"
            onChange={handleNewGalleryChange}
          />
        </label>
        {newGalleryPreviews.length ? (
          <div className="rounded-2xl border border-[#2c3c65] bg-[#111a33] p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#9db3ff]">
              {t("newPhotos")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {newGalleryPreviews.map((url, index) => (
                <div
                  key={url}
                  className="relative aspect-square overflow-hidden rounded-xl border border-[#233050]"
                >
                  <Image
                    src={url}
                    alt={`New gallery preview ${index + 1}`}
                    fill
                    sizes="33vw"
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute bottom-1.5 right-1.5 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-lg">
                    New
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 rounded-2xl border border-[#223253] bg-[#101b33] p-4">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          {t("highlights")}
        </span>
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
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]"
        >
          {t("favoriteTrackLink")}
        </label>
        <input
          id="favorite_track_url"
          name="favorite_track_url"
          type="url"
          defaultValue={defaultValues.favorite_track_url ?? ""}
          placeholder={t("favoriteTrackPlaceholder")}
          className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
        <p className="text-xs text-[var(--muted)]">
          {t("favoriteTrackHelp")}
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-[#223253] bg-[#101b33] p-4">
        <input
          id="is_private"
          name="is_private"
          type="checkbox"
          defaultChecked={defaultValues.is_private}
          className="mt-1 h-4 w-4 rounded border border-[#2b3a63] bg-transparent text-[var(--accent)] focus:ring-[var(--accent)]"
        />
        <label htmlFor="is_private" className="space-y-1 text-sm">
          <span className="flex items-center gap-2 font-semibold text-white">
            {t("privateMode")}
            <span className="rounded-full bg-[#1a2847] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
              {t("hideFromDeck")}
            </span>
          </span>
          <p className="text-xs text-[var(--muted)]">
            {t("privateDescription")}
          </p>
        </label>
      </div>

      <div className="rounded-2xl border border-[#223253] bg-[#101b33] p-4 text-xs text-[var(--muted)]">
        <p>
          {t("magicLinkEmails", { email })}
        </p>
      </div>

      <button
        type="submit"
        className={cn(
          "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]",
        )}
      >
        <span className="relative z-10">{t("save")}</span>
        <div className="absolute inset-0 translate-y-full bg-[var(--accent-strong)] transition group-hover:translate-y-0" />
      </button>

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
    </form>

      {isAvatarCropOpen && avatarRawImage ? (
        <ImageCropModal
          image={avatarRawImage}
          crop={avatarCrop}
          zoom={avatarZoom}
          aspect={AVATAR_ASPECT}
          title={t("adjust")}
          helperText="Pinch or slide to zoom, center your face, and save."
          onCropChange={setAvatarCrop}
          onZoomChange={setAvatarZoom}
          onCropComplete={handleAvatarCropComplete}
          onClose={() => setIsAvatarCropOpen(false)}
          onConfirm={handleAvatarUsePhoto}
        />
      ) : null}
    </>
  );
}

type ImageCropModalProps = {
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

function ImageCropModal({
  image,
  crop,
  zoom,
  aspect,
  title,
  helperText,
  confirmLabel = "Use photo",
  onCropChange,
  onZoomChange,
  onCropComplete,
  onClose,
  onConfirm,
}: ImageCropModalProps) {
  const tCrop = useTranslations("app.profile.crop");
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
            {tCrop("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-[#2f9b7a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ef1b5]"
          >
            {confirmLabel ?? tCrop("apply")}
          </button>
        </div>
      </div>
    </div>
  );
}

