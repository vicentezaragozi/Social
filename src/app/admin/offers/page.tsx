import { redirect } from "next/navigation";

import { getAdminMemberships } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import { toggleOfferStatus } from "@/app/admin/offers/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  OfferDeleteButton,
  OfferForm,
  OfferRedemptionRow,
} from "@/components/admin/offers/offer-form";

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams: { venue?: string };
}) {
  const params = searchParams;
  const { memberships, user } = await getAdminMemberships();
  const activeMembership = params.venue
    ? memberships.find((entry) => entry.venue_id === params.venue)
    : memberships[0];

  if (!activeMembership) {
    redirect("/sign-in/admin?error=venue_access");
  }

  const venue = activeMembership.venues;
  const supabase = await getSupabaseServerClient();

  const { data: offers } = await supabase
    .from("offers")
    .select(
      "id, title, description, cta_label, cta_url, image_url, start_at, end_at, is_active, priority, promo_code",
    )
    .eq("venue_id", venue.id)
    .order("priority", { ascending: false })
    .order("start_at", { ascending: false });

  const offerIds = offers?.map((offer) => offer.id) ?? [];

  let redemptionsByOffer = new Map<
    string,
    {
      count: number;
      redeemedCount: number;
      latest?: { guest: string; acceptedAt: string };
    }
  >();
  let redemptionListByOffer = new Map<
    string,
    {
      id: string;
      guest: string;
      status: string;
      acceptedAt: string;
      redeemedAt: string | null;
    }[]
  >();

  if (offerIds.length > 0) {
    const { data: redemptions } = await supabase
      .from("offer_redemptions")
      .select(
        "id, offer_id, status, accepted_at, redeemed_at, profiles:profile_id(display_name)",
      )
      .in("offer_id", offerIds)
      .order("accepted_at", { ascending: false });

    redemptionsByOffer = new Map(
      offerIds.map((id) => [
        id,
        {
          count: 0,
          redeemedCount: 0,
        },
      ]),
    );
    redemptionListByOffer = new Map(offerIds.map((id) => [id, []]));

    for (const redemption of redemptions ?? []) {
      const entry = redemptionsByOffer.get(redemption.offer_id) ?? {
        count: 0,
        redeemedCount: 0,
      };
      entry.count += 1;
      if (redemption.redeemed_at) {
        entry.redeemedCount += 1;
      }
      if (!entry.latest) {
        entry.latest = {
          guest: redemption.profiles?.display_name ?? "Guest",
          acceptedAt: redemption.accepted_at,
        };
      }
      redemptionsByOffer.set(redemption.offer_id, entry);

      const existingList = redemptionListByOffer.get(redemption.offer_id) ?? [];
      if (existingList.length < 5) {
        existingList.push({
          id: redemption.id,
          guest: redemption.profiles?.display_name ?? "Guest",
          status: redemption.status,
          acceptedAt: redemption.accepted_at,
          redeemedAt: redemption.redeemed_at,
        });
        redemptionListByOffer.set(redemption.offer_id, existingList);
      }
    }
  }

  return (
    <AdminShell userEmail={user.email ?? ""} venues={memberships.map((entry) => entry.venues)}>
    <main className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Offers</h1>
        <p className="text-sm text-[var(--muted)]">
          Toggle venue promotions on the fly. Use higher priority to surface key offers.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Create new offer</h2>
        <OfferForm venueId={venue.id} submitLabel="Create offer" successLabel="Offer created." />
      </section>

      <div className="space-y-4 pt-4">
        {offers?.map((offer) => (
          <div
            key={offer.id}
            className="space-y-3 rounded-3xl border border-[#223253] bg-[#0d162a] p-5 shadow-lg shadow-black/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">{offer.title}</h2>
                <p className="text-sm text-[var(--muted)]">{offer.description}</p>
                <p className="text-xs text-[var(--muted)]">
                  Priority: {offer.priority} · Start:{" "}
                  {offer.start_at ? new Date(offer.start_at).toLocaleString() : "Now"}
                </p>
              </div>
              <div className="text-xs text-[var(--muted)]">
                {offer.is_active ? (
                  <span className="rounded-full border border-[#2f9b7a] px-3 py-1 text-[#5ef1b5]">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full border border-[#70551f] px-3 py-1 text-[#ffb224]">
                    Inactive
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {offer.cta_url ? (
                <a
                  href={offer.cta_url}
                  target="_blank"
                  className="rounded-xl border border-[#2f9b7a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ef1b5]"
                >
                  Preview offer
                </a>
              ) : null}
              <form
                action={async (formData) => {
                  "use server";
                  await toggleOfferStatus({ success: false }, formData);
                }}
                className="flex items-center gap-2"
              >
                <input type="hidden" name="venueId" value={venue.id} />
                <input type="hidden" name="offerId" value={offer.id} />
                <input
                  type="hidden"
                  name="isActive"
                  value={offer.is_active ? "false" : "true"}
                />
                <button className="rounded-xl border border-[#223253] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  {offer.is_active ? "Deactivate" : "Activate"}
                </button>
              </form>
              <OfferDeleteButton venueId={venue.id} offerId={offer.id} />
            </div>
            <div className="rounded-2xl border border-[#1d2946] bg-[#101b33] px-4 py-3 text-xs text-[var(--muted)]">
              <div className="flex flex-wrap items-center gap-4">
                <span>
                  Saved by{" "}
                  <span className="font-semibold text-white">
                    {redemptionsByOffer.get(offer.id)?.count ?? 0}
                  </span>{" "}
                  guests
                </span>
                <span>
                  Redeemed{" "}
                  <span className="font-semibold text-white">
                    {redemptionsByOffer.get(offer.id)?.redeemedCount ?? 0}
                  </span>{" "}
                  times
                </span>
                {offer.promo_code ? (
                  <span>
                    Promo code: <span className="font-semibold text-white">{offer.promo_code}</span>
                  </span>
                ) : null}
                {redemptionsByOffer.get(offer.id)?.latest ? (
                  <span>
                    Last saved by{" "}
                    <span className="font-semibold text-white">
                      {redemptionsByOffer.get(offer.id)?.latest?.guest}
                    </span>{" "}
                    at{" "}
                    {redemptionsByOffer
                      .get(offer.id)
                      ?.latest?.acceptedAt
                      ? new Date(
                          redemptionsByOffer.get(offer.id)?.latest?.acceptedAt ?? "",
                        ).toLocaleString()
                      : ""}
                  </span>
                ) : null}
              </div>
            </div>
            <details className="rounded-2xl border border-[#1d2946] bg-[#101b33]">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white hover:text-[#9db3ff]">
                Guest saves ({redemptionsByOffer.get(offer.id)?.count ?? 0})
              </summary>
              <div className="space-y-3 px-4 pb-4">
                {redemptionListByOffer.get(offer.id)?.length ? (
                  redemptionListByOffer.get(offer.id)?.map((redemption) => (
                    <OfferRedemptionRow
                      key={redemption.id}
                      venueId={venue.id}
                      offerId={offer.id}
                      redemption={redemption}
                    />
                  ))
                ) : (
                  <p className="text-xs text-[var(--muted)]">No guests have saved this offer yet.</p>
                )}
              </div>
            </details>

            <details className="rounded-2xl border border-dashed border-[#223253] bg-[#111b33]">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white hover:text-[#9db3ff]">
                Edit offer details
              </summary>
              <div className="p-4">
                <OfferForm
                  venueId={venue.id}
                  defaultValues={offer}
                  submitLabel="Update offer"
                  successLabel="Offer updated."
                />
              </div>
            </details>
          </div>
        ))}
        {!offers?.length ? (
          <div className="rounded-3xl border border-[#223253] bg-[#0d162a] px-5 py-12 text-center text-sm text-[var(--muted)]">
            No offers created yet.
          </div>
        ) : null}
      </div>
    </main>
    </AdminShell>
  );
}

