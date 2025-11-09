"use client";

import Image from "next/image";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { completeOnboarding, type OnboardingState } from "@/app/(guest)/onboarding/actions";
import { cn } from "@/lib/utils";

type OnboardingDefaults = {
  display_name?: string;
  age?: number;
  is_private?: boolean;
  bio?: string;
  email?: string | null;
};

const initialState: OnboardingState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

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
        {pending ? "Saving your profile..." : "Save profile"}
      </span>
      <div className="absolute inset-0 translate-y-full bg-[var(--accent-strong)] transition group-hover:translate-y-0" />
    </button>
  );
}

export function OnboardingForm({ defaultValues }: { defaultValues: OnboardingDefaults }) {
  const [state, formAction] = useFormState(completeOnboarding, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-[32px] border border-[#1d2946] bg-[var(--surface)]/80 p-6 shadow-xl shadow-black/25 backdrop-blur"
      encType="multipart/form-data"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="display_name"
            className="block text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]"
          >
            Display name
          </label>
          <input
            id="display_name"
            name="display_name"
            required
            defaultValue={defaultValues.display_name}
            placeholder="Your vibe name"
            className="mt-2 w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>
        <div>
          <label
            htmlFor="age"
            className="block text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]"
          >
            Age
          </label>
          <input
            id="age"
            name="age"
            type="number"
            min={18}
            required
            defaultValue={defaultValues.age}
            placeholder="21"
            className="mt-2 w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>
        <div>
          <label
            htmlFor="bio"
            className="block text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]"
          >
            Bio (optional)
          </label>
          <textarea
            id="bio"
            name="bio"
            maxLength={240}
            rows={3}
            defaultValue={defaultValues.bio ?? ""}
            placeholder="Drop a line to break the ice."
            className="mt-2 w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>
      </div>

      <div className="space-y-3">
        <span className="block text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          ID check (internal use)
        </span>
        <label
          htmlFor="id_photo"
          className="relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#2e3a5d] bg-[#0a1020] px-6 py-8 text-center transition hover:border-[var(--accent)] hover:bg-[#121b33]"
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
              {fileName ?? "Tap to upload your ID photo"}
            </p>
            <p className="text-xs text-[var(--muted)]">
              JPEG or PNG · Max 5 MB · Only staff can view
            </p>
          </div>
          <input
            id="id_photo"
            name="id_photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                setPreviewUrl(null);
                setFileName(null);
                return;
              }
              setFileName(file.name);
              setPreviewUrl(URL.createObjectURL(file));
            }}
          />
        </label>
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
          <span className="font-medium">Keep my profile private</span>
          <p className="text-xs text-[var(--muted)]">
            Other guests will only see you when you send them a vibe. Venue staff
            can still verify your information.
          </p>
        </label>
      </div>

      <div className="rounded-2xl border border-[#1d2946] bg-[#0b1224] p-4 text-xs text-[var(--muted)]">
        <p>
          We&apos;ll use{" "}
          <span className="font-medium text-white">magic links</span> to send you
          back into the venue instantly. Emails go to{" "}
          <span className="font-medium text-white">
            {defaultValues.email ?? "your email"}
          </span>
          .
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
            Profile saved. You&apos;re ready to connect once the venue doors open.
          </p>
        ) : null}
      </div>
    </form>
  );
}

