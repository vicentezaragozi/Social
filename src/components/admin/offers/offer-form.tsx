"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";

import {
  deleteOfferAction,
  saveOfferAction,
  updateOfferRedemptionStatus,
  type OfferFormState,
  type OfferUpdateState,
} from "@/app/admin/offers/actions";
import { cn } from "@/lib/utils";

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
  submitLabel = "Save offer",
  successLabel = "Offer saved.",
}: OfferFormProps) {
  const [state, action] = useActionState(saveOfferAction, initialFormState);
  const formRef = useRef<HTMLFormElement | null>(null);

  const isEdit = Boolean(defaultValues?.id);

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
      formRef.current.reset();
    }
  }, [isEdit, state.success]);

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
          Title *
        </label>
        <input
          name="title"
          required
          defaultValue={defaultValues?.title ?? ""}
          placeholder="Half-off cocktails"
          className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Share details about the offer and any fine print."
          className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            Start
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
            End
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
            CTA label
          </label>
          <input
            name="ctaLabel"
            defaultValue={defaultValues?.cta_label ?? ""}
            placeholder="View menu"
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            CTA link
          </label>
          <input
            name="ctaUrl"
            defaultValue={defaultValues?.cta_url ?? ""}
            placeholder="https://example.com/menu"
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            Promo code
          </label>
          <input
            name="promoCode"
            defaultValue={defaultValues?.promo_code ?? ""}
            placeholder="SOCIAL50"
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            Image URL
          </label>
          <input
            name="imageUrl"
            defaultValue={defaultValues?.image_url ?? ""}
            placeholder="https://..."
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            Priority
          </label>
          <input
            type="number"
            name="priority"
            min={0}
            max={999}
            defaultValue={defaultValues?.priority ?? 0}
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6b9eff] focus:ring-2 focus:ring-[#6b9eff]/25"
          />
          <p className="text-xs text-[var(--muted)]">Higher numbers surface first in the guest app.</p>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-[#233050] bg-[#101b33] px-4 py-3 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={defaultValues?.is_active ?? true}
            className="h-4 w-4 rounded border border-[#2b3a63] bg-transparent text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <span className="text-white">Offer is active</span>
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
          {submitLabel}
        </button>
        {state.error ? (
          <span className="text-xs text-[#ff8ba7]">{state.error}</span>
        ) : state.success ? (
          <span className="text-xs text-[#5ef1b5]">{successLabel}</span>
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
  const [state, action] = useActionState(deleteOfferAction, initialDeleteState);

  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="venueId" value={venueId} />
      <input type="hidden" name="offerId" value={offerId} />
      <button
        type="submit"
        className="rounded-xl border border-[#553432] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff8ba7] transition hover:border-[#ff8ba7]"
      >
        Delete
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
  const [state, action] = useActionState(updateOfferRedemptionStatus, initialRedemptionState);
  const isRedeemed = Boolean(redemption.redeemedAt);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#223253] bg-[#0f1b30] px-3 py-2">
      <div className="space-y-1 text-xs text-[var(--muted)]">
        <p className="font-semibold text-white">{redemption.guest}</p>
        <p>Saved {new Date(redemption.acceptedAt).toLocaleString()}</p>
        {isRedeemed ? (
          <p>Redeemed {new Date(redemption.redeemedAt ?? "").toLocaleString()}</p>
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
          {isRedeemed ? "Undo redeem" : "Mark redeemed"}
        </button>
        {state.error ? <span className="text-[#ff8ba7]">{state.error}</span> : null}
      </form>
    </div>
  );
}

