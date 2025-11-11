import Image from "next/image";
import Link from "next/link";

import { requireAuthSession } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDefaultVenue } from "@/lib/supabase/venues";

import type { Database } from "@/lib/supabase/types";

export const metadata = {
  title: "Offers",
};

export default async function OffersPage() {
  await requireAuthSession();
  const venue = await getDefaultVenue();

  const supabase = await getSupabaseServerClient();
  const { data: offersData } = await supabase
    .from("offers")
    .select(
      "id, venue_id, title, description, cta_label, cta_url, image_url, start_at, end_at, is_active, priority, created_at, updated_at",
    )
    .eq("venue_id", venue.id)
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("start_at", { ascending: false });

  const offers = (offersData ??
    []) as Database["public"]["Tables"]["offers"]["Row"][];

  return (
    <main className="mobile-safe min-h-screen bg-[var(--background)] text-white">
      <div className="px-4 pb-32 pt-10">
        <header className="mb-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
            Tonight&apos;s specials
          </p>
          <h1 className="text-2xl font-semibold">{venue.name} Offers</h1>
          <p className="text-sm text-[var(--muted)]">
            From VIP tables to late-night bites, unlock the perks curated by the venue team.
          </p>
        </header>

      {offers && offers.length > 0 ? (
        <ul className="space-y-4">
          {offers.map((offer) => (
            <li
              key={offer.id}
              className="flex flex-col gap-4 rounded-3xl border border-[#223253] bg-[#0d162a] p-5 shadow-lg shadow-black/30"
            >
              <div className="flex items-start gap-4">
                {offer.image_url ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-[#223253]">
                    <Image
                      src={offer.image_url}
                      alt={offer.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#223253] bg-[#101b33] text-3xl">
                    🎁
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <h2 className="text-lg font-semibold text-white">{offer.title}</h2>
                  <p className="text-sm text-[var(--muted)]">{offer.description}</p>
                </div>
              </div>
              {offer.cta_url ? (
                <Link
                  href={offer.cta_url}
                  target="_blank"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[var(--accent-strong)]"
                >
                  {offer.cta_label ?? "Claim offer"}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-3xl border border-[#223253] bg-[#0d162a] px-5 py-12 text-center text-sm text-[var(--muted)]">
          No active offers right now. Check back later tonight.
        </div>
      )}
      </div>
    </main>
  );
}

