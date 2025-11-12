import Image from "next/image";
import Link from "next/link";

import { requireAuthSession } from "@/lib/supabase/auth";
import { getCurrentProfile, getProfileBlockStatus } from "@/lib/supabase/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDefaultVenue } from "@/lib/supabase/venues";

import type { Database } from "@/lib/supabase/types";
import { BlockedNotice } from "@/components/app/blocked-notice";

export const metadata = {
  title: "Offers",
};

export default async function OffersPage() {
  await requireAuthSession();
  const profile = await getCurrentProfile();
  const { isBlocked } = getProfileBlockStatus(profile);
  if (profile && isBlocked) {
    return <BlockedNotice profile={profile} />;
  }

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
                  <div className="text-xs text-[var(--muted)]">
                    <span>
                      Starts {new Date(offer.start_at ?? new Date().toISOString()).toLocaleString()}
                    </span>
                    {offer.end_at ? (
                      <>
                        {" "}
                        · <span>Ends {new Date(offer.end_at).toLocaleString()}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              {offer.promo_code ? (
                <div className="rounded-2xl border border-[#2f9b7a]/40 bg-[#122521] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ef1b5]">
                  Promo code: <span className="text-white">{offer.promo_code}</span>
                </div>
              ) : null}
              {offer.cta_url ? (
                <Link
                  href={offer.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[var(--accent-strong)]"
                >
                  <span>{offer.cta_label ?? "Claim offer"}</span>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.25 4.375h4.375V8.75"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4.375 15.625l11.25-11.25"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.625 11.25v4.375H11.25"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              ) : (
                <p className="text-xs text-[var(--muted)]">
                  Ask staff to redeem this offer at checkout.
                </p>
              )}
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

