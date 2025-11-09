import { requireAdminVenue } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import { toggleOfferStatus } from "@/app/admin/offers/actions";

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams: { venue?: string };
}) {
  const { venue } = await requireAdminVenue(searchParams.venue);
  const supabase = await getSupabaseServerClient();

  const { data: offers } = await supabase
    .from("offers")
    .select(
      "id, title, description, cta_label, cta_url, image_url, start_at, end_at, is_active, priority",
    )
    .eq("venue_id", venue.id)
    .order("priority", { ascending: false })
    .order("start_at", { ascending: false });

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Offers</h1>
        <p className="text-sm text-[var(--muted)]">
          Toggle venue promotions on the fly. Use higher priority to surface key offers.
        </p>
      </header>

      <div className="space-y-4">
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
            </div>
          </div>
        ))}
        {!offers?.length ? (
          <div className="rounded-3xl border border-[#223253] bg-[#0d162a] px-5 py-12 text-center text-sm text-[var(--muted)]">
            No offers created yet.
          </div>
        ) : null}
      </div>
    </main>
  );
}

