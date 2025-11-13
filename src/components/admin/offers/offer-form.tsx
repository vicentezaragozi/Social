"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  deleteOfferAction,
  saveOfferAction,
  updateOfferRedemptionStatus,
  type OfferFormState,
  type OfferUpdateState,
} from "@/app/[locale]/admin/offers/actions";
import { cn } from "@/lib/utils";
import { useFormStatePreservation } from "@/hooks/use-form-state-preservation";

type OfferDraft = {
  id?: string;
  title?: string | null;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  priority?: number | null;
  cta_label?: string | null;
  cta_url?: string | null;
  image_url?: string | null;
  promo_code?: string | null;
  is_active?: boolean | null;
};

const initialFormState: OfferFormState = {};
const initialDeleteState: OfferUpdateState = {};
const initialRedemptionState: OfferUpdateState = {};

const toLocalDateTime = (iso: string | null | undefined) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

type OfferFormProps = {
  venueId: string;
  submitLabel?: string;
  successLabel?: string;
  defaultValues?: OfferDraft;
};

export function OfferForm({
  venueId,
  defaultValues,
  submitLabel,
  successLabel,
}: OfferFormProps) {
  const t = useTranslations("admin.offers.form");
  const tMessages = useTranslations("admin.offers.messages");
  const [state, action] = useActionState(saveOfferAction, initialFormState);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Form state preservation across locale changes
  const { clearSavedState } = useFormStatePreservation(
    "offer-form",
    null,
    null,
    { formRef }
  );

  const isEdit = Boolean(defaultValues?.id);
  const finalSubmitLabel = submitLabel ?? t("submit");
  const finalSuccessLabel = successLabel ?? tMessages("saved");

  const startDefault = useMemo(
    () =>
      toLocalDateTime(
        defaultValues?.start_at ?? (!isEdit ? new Date().toISOString() : undefined),
      ),
    [defaultValues?.start_at, isEdit],
  );
  const endDefault = useMemo(
    () => toLocalDateTime(defaultValues?.end_at ?? undefined),
    [defaultValues?.end_at],
  );

  useEffect(() => {
    if (!isEdit && state.success && formRef.current) {
      clearSavedState();
      formRef.current.reset();
    }
  }, [isEdit, state.success, clearSavedState]);

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-4 rounded-3xl border border-[#1f2c49] bg-[#0d162a]/80 p-6 shadow-lg shadow-black/20"
    >
      <input type="hidden" name="venueId" value={venueId} />
      {defaultValues?.id ? <input type="hidden" name="offerId" value={defaultValues.id} /> : null}

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          {t("title")} *
        </label>
        <input
          name="title"
          required
          defaultValue={defaultValues?.title ?? ""}
          placeholder={t("titlePlaceholder")}
          className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          {t("description")}
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          placeholder={t("descriptionPlaceholder")}
          className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            {t("start")}
          </label>
          <input
            type="datetime-local"
            name="startAt"
            defaultValue={startDefault}
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            {t("end")}
          </label>
          <input
            type="datetime-local"
            name="endAt"
            defaultValue={endDefault}
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            {t("ctaLabel")}
          </label>
          <input
            name="ctaLabel"
            defaultValue={defaultValues?.cta_label ?? ""}
            placeholder={t("ctaLabelPlaceholder")}
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            {t("ctaUrl")}
          </label>
          <input
            name="ctaUrl"
            defaultValue={defaultValues?.cta_url ?? ""}
            placeholder={t("ctaUrlPlaceholder")}
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            {t("promoCode")}
          </label>
          <input
            name="promoCode"
            defaultValue={defaultValues?.promo_code ?? ""}
            placeholder={t("promoCodePlaceholder")}
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            {t("imageUrl")}
          </label>
          <input
            name="imageUrl"
            defaultValue={defaultValues?.image_url ?? ""}
            placeholder={t("imageUrlPlaceholder")}
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            {t("priority")}
          </label>
          <input
            type="number"
            name="priority"
            min={0}
            max={999}
            defaultValue={defaultValues?.priority ?? 0}
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
          />
          <p className="text-xs text-[var(--muted)]">{t("priorityDescription")}</p>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-[#233050] bg-[#101b33] px-4 py-3 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={defaultValues?.is_active ?? true}
            className="h-4 w-4 rounded border border-[#2b3a63] bg-transparent text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <span className="text-white">{t("isActive")}</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className={cn(
            "rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition",
            state.success ? "opacity-80" : "hover:bg-[var(--accent-strong)]",
          )}
        >
          {finalSubmitLabel}
        </button>
        {state.error ? (
          <span className="text-xs text-[#ff8ba7]">{state.error}</span>
        ) : state.success ? (
          <span className="text-xs text-[#5ef1b5]">{finalSuccessLabel}</span>
        ) : null}
      </div>
    </form>
  );
}

type OfferDeleteButtonProps = {
  venueId: string;
  offerId: string;
};

export function OfferDeleteButton({ venueId, offerId }: OfferDeleteButtonProps) {
  const t = useTranslations("admin.offers.actions");
  const [state, action] = useActionState(deleteOfferAction, initialDeleteState);

  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="venueId" value={venueId} />
      <input type="hidden" name="offerId" value={offerId} />
      <button
        type="submit"
        className="rounded-xl border border-[#553432] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff8ba7] transition hover:border-[#ff8ba7]"
      >
        {t("delete")}
      </button>
      {state.error ? <span className="text-xs text-[#ff8ba7]">{state.error}</span> : null}
    </form>
  );
}

type RedemptionListItem = {
  id: string;
  guest: string;
  status: string;
  acceptedAt: string;
  redeemedAt: string | null;
};

type OfferRedemptionRowProps = {
  venueId: string;
  offerId: string;
  redemption: RedemptionListItem;
};

export function OfferRedemptionRow({ venueId, offerId, redemption }: OfferRedemptionRowProps) {
  const t = useTranslations("admin.offers.redemption");
  const [state, action] = useActionState(updateOfferRedemptionStatus, initialRedemptionState);
  const isRedeemed = Boolean(redemption.redeemedAt);
  const [mounted, setMounted] = useState(false);

  // Format dates only on client side to avoid hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString: string) => {
    if (!mounted) {
      // Return ISO string during SSR to avoid hydration mismatch
      try {
        return new Date(dateString).toISOString();
      } catch {
        return dateString;
      }
    }
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#223253] bg-[#0f1b30] px-3 py-2">
      <div className="space-y-1 text-xs text-[var(--muted)]">
        <p className="font-semibold text-white">{redemption.guest}</p>
        <p suppressHydrationWarning>{t("saved")} {formatDate(redemption.acceptedAt)}</p>
        {isRedeemed ? (
          <p suppressHydrationWarning>{t("redeemed")} {formatDate(redemption.redeemedAt ?? "")}</p>
        ) : null}
      </div>
      <form action={action} className="flex items-center gap-2 text-xs">
        <input type="hidden" name="venueId" value={venueId} />
        <input type="hidden" name="offerId" value={offerId} />
        <input type="hidden" name="redemptionId" value={redemption.id} />
        <input type="hidden" name="mark" value={isRedeemed ? "pending" : "redeemed"} />
        <button
          type="submit"
          className={cn(
            "rounded-xl border px-3 py-1 font-semibold uppercase tracking-[0.2em] transition",
            isRedeemed
              ? "border-[#223253] text-[#9fb3ff] hover:border-[#9fb3ff] hover:text-white"
              : "border-[#2f9b7a] text-[#5ef1b5] hover:border-[#5ef1b5] hover:text-white",
          )}
        >
          {isRedeemed ? t("undoRedeem") : t("markRedeemed")}
        </button>
        {state.error ? <span className="text-[#ff8ba7]">{state.error}</span> : null}
      </form>
    </div>
  );
}

