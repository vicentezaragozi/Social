"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

import {
  acceptOfferAction,
  sendInteractionAction,
  type AcceptOfferState,
  type InteractionActionState,
} from "@/app/[locale]/(app)/app/actions";
import { cn } from "@/lib/utils";
import { buildWhatsAppLink } from "@/lib/util/whatsapp";

import type { Database } from "@/lib/supabase/types";

const COACHMARK_KEY = "social:connect-coachmark-dismissed";
const MATCH_SEEN_KEY = "social:last-match-timestamp";
const INVITE_SEEN_KEY = "social:last-invite-timestamp";
const TOOLTIP_KEY = "social:connect-tooltip-seen";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SessionWithProfile =
  Database["public"]["Tables"]["venue_sessions"]["Row"] & {
    profiles: ProfileRow | null;
    is_venue_host?: boolean;
  };

type InteractionRow = Database["public"]["Tables"]["interactions"]["Row"];
type MatchRow =
  Database["public"]["Tables"]["matches"]["Row"] & {
    profiles: ProfileRow | null;
    profiles_b: ProfileRow | null;
  };
type OfferRow = Database["public"]["Tables"]["offers"]["Row"];
type OfferRedemptionRow = Database["public"]["Tables"]["offer_redemptions"]["Row"];
export type OfferRedemptionSummary = Pick<
  OfferRedemptionRow,
  "offer_id" | "promo_code" | "status" | "accepted_at" | "redeemed_at"
>;
type EnrichedMatch = MatchRow & {
  partner: ProfileRow | null;
};
type IncomingInteraction = InteractionRow & {
  sender?: ProfileRow | null;
};
type OutgoingInteraction = InteractionRow & {
  receiver?: ProfileRow | null;
};

type ConnectFeedProps = {
  currentProfile: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    isPrivate: boolean;
  };
  venue: {
    id: string;
    name: string;
  };
  activeSessionId: string;
  attendees: SessionWithProfile[];
  outgoingInteractions: OutgoingInteraction[];
  incomingInteractions: IncomingInteraction[];
  matches: MatchRow[];
  sessionEmail: string;
  offers: OfferRow[];
  offerRedemptions: OfferRedemptionSummary[];
};

type ConnectCard = {
  sessionId: string;
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  age: number | null;
  tagline: string | null;
  likedByMe: boolean;
  invitedByMe: boolean;
  theyLikedYou: boolean;
  matched: boolean;
  whatsappUrl: string | null;
  highlightTags: string[];
  galleryUrls: string[];
  favoriteTrackUrl: string | null;
  isVenueHost?: boolean;
};

type InteractionButtonProps = {
  receiverId: string;
  activeSessionId: string;
  type: "like" | "invite";
  label: string;
  icon: string;
  disabled?: boolean;
};

const interactionInitialState: InteractionActionState = {};
const acceptInitialState: AcceptOfferState = {};
type ToastMessage = {
  id: string;
  title: string;
  description: string;
  variant: "match" | "invite";
  action?: {
    label: string;
    href: string;
    external?: boolean;
  };
};

export function ConnectFeed(props: ConnectFeedProps) {
  const tToasts = useTranslations("app.connect.toasts");
  const tButtons = useTranslations("app.connect.buttons");
  const tLabels = useTranslations("app.connect.labels");
  const tWhatsApp = useTranslations("app.matches.whatsapp");
  
  const groupedOutgoing = useMemo(() => {
    const map = new Map<string, Partial<Record<"like" | "invite", InteractionRow>>>();
    props.outgoingInteractions.forEach((interaction) => {
      if (interaction.status !== "pending") {
        return;
      }
      const existing = map.get(interaction.receiver_id) ?? {};
      existing[interaction.interaction_type as "like" | "invite"] = interaction;
      map.set(interaction.receiver_id, existing);
    });
    return map;
  }, [props.outgoingInteractions]);

  const groupedIncoming = useMemo(() => {
    const map = new Map<string, InteractionRow[]>();
    props.incomingInteractions.forEach((interaction) => {
      const existing = map.get(interaction.sender_id) ?? [];
      existing.push(interaction);
      map.set(interaction.sender_id, existing);
    });
    return map;
  }, [props.incomingInteractions]);

  const matchesWithPartner = useMemo<EnrichedMatch[]>(() => {
    return [...props.matches]
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
      )
      .map((match) => ({
        ...match,
        partner:
          match.profile_a === props.currentProfile.id ? match.profiles_b : match.profiles,
      }));
  }, [props.matches, props.currentProfile.id]);

  const matchedProfiles = useMemo(() => {
    const set = new Set<string>();
    matchesWithPartner.forEach((match) => {
      const partnerId =
        match.partner?.id ??
        (match.profile_a === props.currentProfile.id ? match.profile_b : match.profile_a);
      if (partnerId) {
        set.add(partnerId);
      }
    });
    return set;
  }, [matchesWithPartner, props.currentProfile.id]);

  const initialOfferRedemptions = useMemo(() => {
    return new Map<string, OfferRedemptionSummary>(
      props.offerRedemptions.map((redemption) => [
        redemption.offer_id,
        redemption,
      ]),
    );
  }, [props.offerRedemptions]);

  const [offerRedemptions, setOfferRedemptions] = useState(initialOfferRedemptions);

  useEffect(() => {
    setOfferRedemptions(initialOfferRedemptions);
  }, [initialOfferRedemptions]);

  // Create a map of profile IDs to their match WhatsApp URLs
  const matchWhatsAppMap = useMemo(() => {
    const map = new Map<string, string | null>();
    const whatsappMessage = tWhatsApp("messageTemplate");
    matchesWithPartner.forEach((match) => {
      const partnerId =
        match.partner?.id ??
        (match.profile_a === props.currentProfile.id ? match.profile_b : match.profile_a);
      if (partnerId && match.partner) {
        // Build WhatsApp link with partner's phone number if available
        if (match.partner.phone_number) {
          map.set(partnerId, buildWhatsAppLink(whatsappMessage, match.partner.phone_number));
        } else {
          // Fallback to stored URL
          map.set(partnerId, match.whatsapp_url ?? null);
        }
      }
    });
    return map;
  }, [matchesWithPartner, props.currentProfile.id, tWhatsApp]);

  const cards = useMemo<ConnectCard[]>(() => {
    return props.attendees
      .map((session) => {
        const profile = session.profiles;
        if (!profile) return null;

        const outgoing = groupedOutgoing.get(profile.id) ?? {};
        const incoming = groupedIncoming.get(profile.id) ?? [];
        const theyLikedYou = incoming.some((interaction) => interaction.status === "pending");
        const matched = matchedProfiles.has(profile.id);
        const highlightTags = (profile.highlight_tags ?? [])
          .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
          .filter(Boolean);
        const galleryUrls = profile.gallery_urls ?? [];

        return {
          sessionId: session.id,
          profileId: profile.id,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          bio: profile.bio,
          age: profile.age ?? null,
          tagline: extractTagline(profile.bio),
          likedByMe: outgoing.like?.status === "pending",
          invitedByMe: outgoing.invite?.status === "pending",
          theyLikedYou,
          matched,
          whatsappUrl: matchWhatsAppMap.get(profile.id) ?? null,
          highlightTags: highlightTags.length ? highlightTags : extractVibeTags(profile.bio ?? ""),
          galleryUrls,
          favoriteTrackUrl: profile.favorite_track_url,
          isVenueHost: session.is_venue_host ?? false,
        } satisfies ConnectCard;
      })
      .filter(Boolean) as ConnectCard[];
  }, [props.attendees, groupedOutgoing, groupedIncoming, matchedProfiles, matchWhatsAppMap]);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  const addToast = useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      if (typeof window === "undefined") return;
      const id =
        window.crypto?.randomUUID?.() ??
        `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [...prev, { id, ...toast }]);
      window.setTimeout(() => removeToast(id), 6000);
    },
    [removeToast],
  );

  const handleOfferAccepted = useCallback(
    (offerId: string, promoCode?: string | null, alreadyAccepted?: boolean) => {
      setOfferRedemptions((prev) => {
        const next = new Map(prev);
        const existing = next.get(offerId);
        next.set(offerId, {
          offer_id: offerId,
          promo_code: promoCode ?? existing?.promo_code ?? null,
          status: existing?.status ?? "accepted",
          accepted_at: existing?.accepted_at ?? new Date().toISOString(),
          redeemed_at: existing?.redeemed_at ?? null,
        });
        return next;
      });
      addToast({
        variant: "invite",
        title: alreadyAccepted ? tToasts("offerAlreadySaved") : tToasts("offerSaved"),
        description: promoCode
          ? tToasts("offerSavedDescription", { promoCode })
          : tToasts("offerSavedGeneric"),
      });
    },
    [addToast, tToasts],
  );
  const [showFirstVisitTooltip, setShowFirstVisitTooltip] = useState(false);
  const [celebrationMatch, setCelebrationMatch] = useState<EnrichedMatch | null>(null);
  const dismissCelebration = useCallback(() => setCelebrationMatch(null), []);
  const dismissFirstVisitTooltip = useCallback(() => setShowFirstVisitTooltip(false), []);
  const [hydrated, setHydrated] = useState(false);

  const liveCount = cards.length + (props.currentProfile.isPrivate ? 0 : 1);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const [coachmarkOpen, dismissCoachmark] = useCoachmark();

  const scrollToIndex = useCallback((index: number) => {
    const container = carouselRef.current;
    if (!container) return;
    const child = container.children[index] as HTMLElement | undefined;
    if (!child) return;
    child.scrollIntoView({ behavior: "smooth", inline: "center" });
  }, []);

  const handleScroll = useCallback(() => {
    const container = carouselRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLDivElement[];
    if (!children.length) return;
    const { scrollLeft } = container;
    const widths = children.map((child) => child.offsetWidth + parseFloat(getComputedStyle(child).marginRight));
    const total = widths.reduce((acc, width) => acc + width, 0);
    if (total === 0) return;
    let accumulated = 0;
    for (let index = 0; index < widths.length; index++) {
      const currentWidth = widths[index];
      if (scrollLeft < accumulated + currentWidth / 2) {
        setActiveIndex(index);
        return;
      }
      accumulated += currentWidth;
    }
    setActiveIndex(widths.length - 1);
  }, []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;
    const listener = () => handleScroll();
    container.addEventListener("scroll", listener, { passive: true });
    handleScroll();
    return () => container.removeEventListener("scroll", listener);
  }, [handleScroll]);

  useEffect(() => {
    if (typeof window === "undefined" || !matchesWithPartner.length) return;
    const newest = matchesWithPartner[0];
    const newestTimestamp = new Date(newest.created_at ?? 0).getTime();
    if (!Number.isFinite(newestTimestamp)) return;
    const lastSeen = Number(window.localStorage.getItem(MATCH_SEEN_KEY) ?? 0);
    const now = Date.now();
    
    // If this is a very recent match (within last 2 minutes), always show it
    // This ensures matches created just now are shown immediately
    const isVeryRecent = now - newestTimestamp < 2 * 60 * 1000;
    
    if (lastSeen === 0 && !isVeryRecent && now - newestTimestamp > 5 * 60 * 1000) {
      // Old match on first visit - don't show
      window.localStorage.setItem(MATCH_SEEN_KEY, String(newestTimestamp));
      return;
    }
    if (!isVeryRecent && newestTimestamp <= lastSeen) return;

    const partnerName = newest.partner?.display_name ?? "a guest";
    addToast({
      variant: "match",
      title: tToasts("newMatchUnlocked"),
      description: tToasts("matchDescription", { partnerName }),
      action: newest.whatsapp_url
        ? {
            label: tToasts("openWhatsApp"),
            href: newest.whatsapp_url,
            external: true,
          }
        : {
            label: tToasts("viewMatches"),
            href: "/matches",
          },
    });
    window.localStorage.setItem(MATCH_SEEN_KEY, String(newestTimestamp));
    setCelebrationMatch(newest);
  }, [matchesWithPartner, addToast, tToasts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pending = props.incomingInteractions.filter(
      (interaction) => interaction.status === "pending",
    );
    if (!pending.length) return;
    const newest = [...pending].sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
    )[0];
    const newestTimestamp = new Date(newest.created_at ?? 0).getTime();
    if (!Number.isFinite(newestTimestamp)) return;
    const lastSeen = Number(window.localStorage.getItem(INVITE_SEEN_KEY) ?? 0);
    const now = Date.now();
    if (lastSeen === 0 && now - newestTimestamp > 10 * 60 * 1000) {
      window.localStorage.setItem(INVITE_SEEN_KEY, String(newestTimestamp));
      return;
    }
    if (newestTimestamp <= lastSeen) return;

    const senderProfile = "sender" in newest ? newest.sender ?? null : null;
    const senderFromDeck = cards.find((card) => card.profileId === newest.sender_id);
    const senderName =
      senderProfile?.display_name ?? senderFromDeck?.displayName ?? "A new guest";
    const isInvite = newest.interaction_type === "invite";

    addToast({
      variant: "invite",
      title: isInvite ? tToasts("newInviteIncoming") : tToasts("newHeartReceived"),
      description: isInvite
        ? tToasts("inviteDescription", { senderName })
        : tToasts("heartDescription", { senderName }),
      action: {
        label: tToasts("reviewInMatches"),
        href: "/matches",
      },
    });
    window.localStorage.setItem(INVITE_SEEN_KEY, String(newestTimestamp));
  }, [props.incomingInteractions, cards, addToast, tToasts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(TOOLTIP_KEY);
    if (!seen) {
      setShowFirstVisitTooltip(true);
      window.localStorage.setItem(TOOLTIP_KEY, String(Date.now()));
    }
  }, []);

  useEffect(() => {
    if (!showFirstVisitTooltip) return;
    const timeout = window.setTimeout(() => setShowFirstVisitTooltip(false), 8000);
    return () => window.clearTimeout(timeout);
  }, [showFirstVisitTooltip]);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    swipeStartX.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const startX = swipeStartX.current;
      if (startX == null) return;
      const endX = event.changedTouches[0]?.clientX ?? startX;
      swipeStartX.current = null;
      const delta = startX - endX;
      if (Math.abs(delta) < 40) return;
      if (delta > 0 && activeIndex < cards.length - 1) {
        scrollToIndex(activeIndex + 1);
      } else if (delta < 0 && activeIndex > 0) {
        scrollToIndex(activeIndex - 1);
      }
    },
    [activeIndex, cards.length, scrollToIndex],
  );

  return (
    <main className="mobile-safe relative min-h-screen overflow-hidden bg-[#050b1e] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -left-28 -top-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,#4336f3_0%,rgba(67,54,243,0)_65%)] opacity-[0.35] blur-3xl animate-[glowFloat_18s_ease-in-out_infinite]" />
        <div className="absolute -right-32 bottom-[-30%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,#f6408c_0%,rgba(246,64,140,0)_70%)] opacity-30 blur-3xl animate-[glowDrift_22s_ease-in-out_infinite]" />
      </div>

      {coachmarkOpen ? <Coachmark onDismiss={dismissCoachmark} /> : null}

      <div className="relative z-10 px-4 pb-36 pt-10 sm:px-6">
      <LiveHeader
        currentProfile={props.currentProfile}
        venueName={props.venue.name}
        liveCount={liveCount}
        attendees={cards}
        sessionEmail={props.sessionEmail}
      />
        <OffersPanel
          offers={props.offers}
          redemptions={offerRedemptions}
          onOfferAccepted={handleOfferAccepted}
        />

        {hydrated ? (
          cards.length ? (
            <section className="mt-10 space-y-6">
          <div
            ref={carouselRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="grid gap-6 justify-items-center md:-mx-1 md:flex md:snap-x md:snap-mandatory md:gap-4 md:overflow-x-auto md:pb-6 md:pl-1 md:pr-8"
          >
                {cards.map((card, index) => {
                  const detailBio =
                    card.bio &&
                    card.tagline &&
                    card.bio.trim().toLowerCase() === card.tagline.trim().toLowerCase()
                      ? null
                      : card.bio;

                  return (
              <article
                key={card.sessionId}
                className={cn(
                        "relative aspect-[10/16] w-full max-w-[360px] overflow-hidden rounded-[32px] border border-[#1d2946] bg-[#0e1426]/95 shadow-[0_30px_60px_-35px_rgba(6,4,28,0.9)] backdrop-blur transition-transform md:w-[min(320px,82vw)] md:shrink-0 md:snap-center",
                        index === activeIndex ? "scale-100" : "md:scale-[0.94]",
                )}
              >
                      <CardMedia
                        avatarUrl={card.avatarUrl}
                        galleryUrls={card.galleryUrls}
                        name={card.displayName}
                      />
                <CardOverlay card={card} />
                      <div className="absolute inset-x-0 bottom-0 z-30 rounded-b-[32px] bg-gradient-to-t from-[#0b1224] via-[#0b1224]/85 to-transparent px-5 pb-5 pt-16">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    {card.isVenueHost && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#1a2a4a] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#6b9eff]">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        {tLabels("staff")}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-semibold leading-tight">
                        {card.displayName}
                                  {card.age ? (
                                    <span className="ml-2 text-base font-medium text-[#9fb0ff]">
                                      {card.age}
                                    </span>
                                  ) : null}
                      </h3>
                    </div>
                              {card.tagline ? (
                                <p className="text-sm font-medium text-[#9fb0ff]">{card.tagline}</p>
                              ) : null}
                              {detailBio ? (
                                <p className="text-sm text-[var(--muted)] line-clamp-3">{detailBio}</p>
                              ) : (
                                <p className="text-sm text-[var(--muted)] line-clamp-3">
                      {card.bio || tLabels("keepingVibeMysterious")}
                    </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {card.matched && card.whatsappUrl ? (
                                <Link
                                  href={card.whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex min-w-[140px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#25D366] to-[#20BA5A] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/30 transition hover:from-[#2AE371] hover:to-[#25D366] hover:shadow-xl hover:shadow-[#25D366]/40 hover:scale-[1.03]"
                                >
                                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                  {tButtons("message")}
                                </Link>
                              ) : (
                                <InteractionButton
                                  receiverId={card.profileId}
                                  activeSessionId={props.activeSessionId}
                                  type="invite"
                                  label={card.invitedByMe ? tButtons("vibeSent") : tButtons("sendVibe")}
                                  icon="✨"
                                  disabled={card.invitedByMe}
                                />
                              )}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <HighlightTagList tags={card.highlightTags} />
                            {card.favoriteTrackUrl ? (
                              <a
                                href={card.favoriteTrackUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-xs font-semibold text-[#9fb0ff] hover:text-white"
                              >
                                <span className="text-base">🎧</span>
                                {tLabels("favoriteTrack")}
                              </a>
                            ) : null}
                    {card.theyLikedYou && !card.matched ? (
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#5ef1b5]/40 bg-[#122c26] px-3 py-1 text-xs font-medium text-[#5ef1b5]">
                        <span>✨</span> {tLabels("theyLikedYou")}
                      </div>
                    ) : null}
                    {card.matched ? (
                      <Link
                        href="/matches"
                        className="inline-flex items-center gap-2 rounded-full border border-[#8a2be2]/40 bg-[#1b1030] px-3 py-1 text-xs font-semibold text-[#c9a3ff]"
                      >
                        {tLabels("viewMatchDetails")}
                      </Link>
                    ) : null}
                            <p className="text-right text-[11px] font-semibold uppercase tracking-[0.35em] text-[#8fa4ff]">
                              {tLabels("matchOnMutual")}
                            </p>
                  </div>
                  </div>
                </div>
              </article>
                  );
                })}
          </div>
          <CarouselDots count={cards.length} activeIndex={activeIndex} />
        </section>
      ) : (
        <EmptyState
          isPrivate={props.currentProfile.isPrivate}
          venueName={props.venue.name}
          liveCount={liveCount}
        />
          )
        ) : (
          <SkeletonDeck />
      )}

      </div>
      <ToastStack toasts={toasts} onDismiss={removeToast} />
      {showFirstVisitTooltip && !coachmarkOpen && cards.length ? (
        <FirstVisitTooltip onDismiss={dismissFirstVisitTooltip} />
      ) : null}
      {celebrationMatch ? (
        <MatchCelebration
          match={celebrationMatch}
          currentProfileName={props.currentProfile.displayName}
          onClose={dismissCelebration}
        />
      ) : null}
    </main>
  );
}

function InteractionButton({
  receiverId,
  activeSessionId,
  type,
  label,
  icon,
  disabled,
}: InteractionButtonProps) {
  const [state, formAction] = useActionState(sendInteractionAction, interactionInitialState);

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="receiverId" value={receiverId} />
      <input type="hidden" name="sessionId" value={activeSessionId} />
      <input type="hidden" name="type" value={type} />
      <InteractionSubmit
        type={type}
        label={label}
        icon={icon}
        disabled={disabled}
      />
      {state.error ? (
        <p className="mt-2 text-center text-xs text-[#ff8ba7]">{state.error}</p>
      ) : null}
    </form>
  );
}

function LiveHeader({
  currentProfile,
  venueName,
  liveCount,
  attendees,
  sessionEmail,
}: {
  currentProfile: ConnectFeedProps["currentProfile"];
  venueName: string;
  liveCount: number;
  attendees: ConnectCard[];
  sessionEmail: string;
}) {
  const t = useTranslations("app.connect.header");
  const tButtons = useTranslations("app.connect.buttons");
  const liveLabel = liveCount === 1 ? t("guest") : t("guests");

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#212f54] bg-[#0b1224]/80 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#283567] bg-[#111a33]/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#9db3ff]">
            <span className="text-base leading-none">📍</span>
            {t("socialAt", { venueName })}
          </span>
          <div className="flex items-center gap-2 rounded-full border border-[#2f9b7a]/40 bg-[#122521] px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5ef1b5] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5ef1b5]"></span>
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5ef1b5]">
              {liveCount} {liveLabel} {t("live")}
            </span>
        </div>
          </div>
        {attendees.length > 0 && (
          <div className="flex -space-x-2">
            {attendees.slice(0, 5).map((attendee, index) => (
              <div
                key={`${attendee.profileId}-${index}`}
                className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#0b1224] bg-[#1a2847]"
                title={attendee.displayName}
              >
                {attendee.avatarUrl || attendee.galleryUrls[0] ? (
                  <img
                    src={attendee.galleryUrls[0] || attendee.avatarUrl || ""}
                    alt={attendee.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-white">
                    {attendee.displayName.slice(0, 1).toUpperCase()}
        </div>
                )}
              </div>
            ))}
            {attendees.length > 5 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0b1224] bg-[#283567] text-[10px] font-semibold text-[#9db3ff]">
                +{attendees.length - 5}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[#273564] bg-[#101a33]/70 px-3 py-1 font-semibold uppercase tracking-[0.4em] text-[11px] text-[#8796c6]">
            {t("swipeDeck")}
          </span>
          <span>
            {attendees.length
              ? t("swipeInstructions")
              : t("openingFloor")}
          </span>
        </div>
        <Link href="/matches" className="self-start rounded-full border border-[#2d3f6f] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-[var(--muted)] hover:border-[var(--accent)] hover:text-white sm:self-auto">
          {tButtons("viewMatches")}
        </Link>
      </div>
    </header>
  );
}

function AvatarRing({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  if (!avatarUrl) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#28345c] bg-[#101832] text-base font-semibold">
        {name.slice(0, 1).toUpperCase()}
      </div>
    );
  }
  return (
    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[#28345c]">
      <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="48px" />
    </div>
  );
}

function LiveAvatarStack({
  attendees,
  currentAvatar,
}: {
  attendees: ConnectCard[];
  currentAvatar: string | null;
}) {
  const allAvatars = [currentAvatar, ...attendees.map((card) => card.avatarUrl)].filter(
    Boolean,
  ) as string[];
  const avatars = allAvatars.slice(0, 5);
  const remaining = Math.max(0, allAvatars.length - avatars.length);
  return (
    <div className="flex -space-x-3">
      {avatars.map((avatar, index) => (
        <div
          key={`${avatar}-${index}`}
          className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-[var(--background)]"
        >
          <Image src={avatar} alt="Guest avatar" fill className="object-cover" sizes="32px" />
        </div>
      ))}
      {remaining > 0 ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--background)] bg-[#111a33] text-xs font-semibold text-[#8fa4ff]">
          +{remaining}
        </div>
      ) : null}
    </div>
  );
}

function CardMedia({
  avatarUrl,
  galleryUrls,
  name,
}: {
  avatarUrl: string | null;
  galleryUrls: string[];
  name: string;
}) {
  const [imageError, setImageError] = useState(false);
  const primary = galleryUrls[0] ?? avatarUrl;
  
  if (!primary || imageError) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#302466,transparent_65%)]" aria-hidden />
    );
  }
  
  return (
    <Image
      src={primary}
      alt={name}
      fill
      sizes="(max-width: 768px) 80vw, 320px"
      className="object-cover"
      onError={() => setImageError(true)}
      unoptimized
    />
  );
}

export function OffersPanel({
  offers,
  redemptions,
  onOfferAccepted,
}: {
  offers: OfferRow[];
  redemptions: Map<string, OfferRedemptionSummary>;
  onOfferAccepted?: (offerId: string, promoCode?: string | null, alreadyAccepted?: boolean) => void;
}) {
  const t = useTranslations("app.connect.offers");
  const handleAccept =
    onOfferAccepted ??
    (() => {
      /* noop */
    });

  if (!offers.length) return null;

  return (
    <section className="mt-6 space-y-4 rounded-3xl border border-[#21334d] bg-[#0c162b]/90 p-5 shadow-lg shadow-black/30">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{t("tonightsOffers")}</p>
          <h2 className="text-lg font-semibold text-white">{t("perksForGuests")}</h2>
        </div>
        <p className="text-xs text-[var(--muted)]">{t("saveCodes")}</p>
      </header>
      <div className="space-y-3">
        {offers.map((offer) => (
          <OfferTile
            key={offer.id}
            offer={offer}
            redemption={redemptions.get(offer.id)}
            onOfferAccepted={handleAccept}
          />
        ))}
      </div>
    </section>
  );
}

function OfferTile({
  offer,
  redemption,
  onOfferAccepted,
}: {
  offer: OfferRow;
  redemption?: OfferRedemptionSummary;
  onOfferAccepted: (offerId: string, promoCode?: string | null, alreadyAccepted?: boolean) => void;
}) {
  const t = useTranslations("app.connect.offers");
  const [state, formAction] = useActionState(acceptOfferAction, acceptInitialState);
  const announcedRef = useRef(false);
  const isClaimed = Boolean(redemption);

  useEffect(() => {
    if (state.success && state.offerId === offer.id && !announcedRef.current) {
      onOfferAccepted(offer.id, state.promoCode ?? offer.promo_code ?? null, state.alreadyAccepted);
      announcedRef.current = true;
    }
    if (!state.success || state.offerId !== offer.id) {
      announcedRef.current = false;
    }
  }, [
    state.success,
    state.offerId,
    state.promoCode,
    state.alreadyAccepted,
    offer.id,
    offer.promo_code,
    onOfferAccepted,
  ]);

  const acceptedAt = redemption?.accepted_at
    ? new Date(redemption.accepted_at).toLocaleString()
    : null;

  return (
    <div className="space-y-3 rounded-2xl border border-[#1d2946] bg-[#101c34]/80 p-4 shadow-inner shadow-black/20">
      {offer.image_url ? (
        <div className="relative h-40 w-full overflow-hidden rounded-xl border border-[#1d2946]">
          <Image
            src={offer.image_url}
            alt={offer.title}
            fill
            className="object-cover"
            sizes="400px"
            unoptimized
          />
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">{offer.title}</h3>
        {offer.description ? (
          <p className="text-sm text-[var(--muted)]">{offer.description}</p>
        ) : null}
      </div>
      {offer.promo_code ? (
        <div className="rounded-xl border border-[#2f9b7a]/40 bg-[#122521] px-4 py-2 text-xs text-[#5ef1b5]">
          {isClaimed && (redemption?.promo_code ?? offer.promo_code)
            ? t("promoCode", { code: redemption?.promo_code ?? offer.promo_code })
            : t("saveToReveal")}
        </div>
      ) : null}
      {isClaimed && acceptedAt ? (
        <p className="text-xs text-[var(--muted)]">{t("savedAt", { time: acceptedAt })}.</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <form action={formAction}>
          <input type="hidden" name="offerId" value={offer.id} />
          <OfferClaimButton disabled={isClaimed} />
        </form>
        {offer.cta_url ? (
          <a
            href={offer.cta_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-[#2f3f6c] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9fb0ff] transition hover:border-[#9fb3ff] hover:text-white"
          >
            {offer.cta_label ?? t("viewDetails")}
          </a>
        ) : null}
      </div>
      {state.error && (!state.offerId || state.offerId === offer.id) ? (
        <p className="text-xs text-[#ff8ba7]">{state.error}</p>
      ) : null}
    </div>
  );
}

function OfferClaimButton({ disabled }: { disabled: boolean }) {
  const t = useTranslations("app.connect.offers");
  const { pending } = useFormStatus();
  const label = disabled ? t("saved") : pending ? t("saving") : t("saveOffer");
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={cn(
        "rounded-2xl border border-[#2f9b7a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ef1b5] transition",
        disabled || pending ? "opacity-60" : "hover:border-[#5ef1b5] hover:text-white",
      )}
    >
      {label}
    </button>
  );
}

function CardOverlay({ card }: { card: ConnectCard }) {
  const t = useTranslations("app.connect.labels");
  if (!card.likedByMe && !card.theyLikedYou) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end p-4">
      <div className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white">
        {card.matched ? t("matched") : card.theyLikedYou ? t("theyLikedYou") : t("heartSent")}
      </div>
    </div>
  );
}

function CarouselDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  if (count <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 w-8 rounded-full bg-[#1f2b4d] transition",
            activeIndex === index ? "bg-white" : undefined,
          )}
        />
      ))}
    </div>
  );
}

function MatchesPreview({ matches }: { matches: EnrichedMatch[] }) {
  const t = useTranslations("app.connect.matchesPreview");
  const tCommonActions = useTranslations("common.actions");
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!matches.length) return null;
  const recent = matches[0];
  const partnerName = recent.partner?.display_name ?? t("aGuest");
  
  // Format time consistently to avoid hydration mismatches
  const formatMatchTime = () => {
    if (!mounted) {
      // Return ISO string during SSR
      try {
        return new Date(recent.created_at ?? 0).toISOString();
      } catch {
        return "";
      }
    }
    try {
      return new Date(recent.created_at ?? 0).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };
  
  const matchTime = formatMatchTime();
  const whatsappHref = recent.whatsapp_url ?? "/matches";
  const isExternal = Boolean(recent.whatsapp_url);
  const ctaLabel = isExternal ? t("jumpIntoWhatsApp") : t("viewMatches");

  return (
    <section className="mt-10 space-y-3 rounded-3xl border border-[#223253] bg-[#0d162a] p-6 text-sm text-[var(--muted)] shadow-[0_25px_45px_-30px_rgba(6,9,21,0.85)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{t("matches")}</p>
          <h2 className="text-lg font-semibold text-white">{t("keepVibeGoing")}</h2>
        </div>
        <Link
          href="/matches"
          className="rounded-full border border-[#2f3f6c] px-3 py-1 text-[11px] uppercase tracking-[0.25em] hover:border-[var(--accent)] hover:text-white"
        >
          {tCommonActions("viewAll")}
        </Link>
      </div>
      <p suppressHydrationWarning>
        {t("matchedWith", { partnerName, time: matchTime })}
      </p>
      <Link
        href={whatsappHref}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4336f3] px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[#5448ff]"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}

function EmptyState({
  isPrivate,
  venueName,
  liveCount,
}: {
  isPrivate: boolean;
  venueName: string;
  liveCount: number;
}) {
  const t = useTranslations("app.connect.emptyState");
  const tCommonActions = useTranslations("common.actions");
  const headline = isPrivate
    ? t("privateModeOn")
    : liveCount > 1
      ? t("floorToYourself")
      : t("venueWarmingUp", { venueName });

  const description = isPrivate
    ? t("privateDescription")
    : liveCount > 1
      ? t("floorDescription")
      : t("warmingUpDescription");

  const tips = isPrivate
    ? [
        t("privateTip1"),
        t("privateTip2"),
      ]
    : [
        t("publicTip1"),
        t("publicTip2"),
      ];

  return (
    <section className="mt-12 flex justify-center">
      <div className="w-full max-w-xl space-y-6 rounded-[32px] border border-[#223253] bg-[#0d162a]/90 px-8 py-12 text-center text-sm text-[var(--muted)] shadow-[0_25px_45px_-35px_rgba(11,17,33,0.85)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#2f3f6f] bg-[#111a33] text-2xl">
          {isPrivate ? "🛡️" : "🌙"}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">{headline}</h2>
          <p>{description}</p>
        </div>
        <div className="space-y-3 rounded-3xl border border-[#283a64]/60 bg-[#111a33]/60 px-6 py-5 text-left text-xs text-[#a1b0da] sm:text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8092d6]">
            {t("whyDontSeeOthers")}
          </p>
          <ul className="space-y-2">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-2 leading-relaxed">
                <span className="mt-[2px] text-base text-[#8da0f8]">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap justify-center gap-3 text-[11px] uppercase tracking-[0.25em]">
        <Link
          href="/offers"
            className="rounded-full border border-[#283a64] px-4 py-2 text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
        >
          {tCommonActions("seeOffers")}
        </Link>
        <Link
          href="/requests"
            className="rounded-full border border-[#283a64] px-4 py-2 text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
        >
          {tCommonActions("requestSong")}
        </Link>
        </div>
      </div>
    </section>
  );
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 right-4 z-[80] flex w-[min(320px,90vw)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto overflow-hidden rounded-2xl border px-4 py-4 shadow-[0_20px_40px_-25px_rgba(7,10,24,0.9)] transition",
            toast.variant === "match"
              ? "border-[#4336f3]/80 bg-[#111a33]/95"
              : "border-[#2f9b7a]/80 bg-[#10221d]/95",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#9db3ff]">
                {toast.title}
              </p>
              <p className="text-sm text-white">{toast.description}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-lg leading-none text-white/60 transition hover:text-white"
            >
              ×
            </button>
          </div>
          {toast.action ? (
            <Link
              href={toast.action.href}
              target={toast.action.external ? "_blank" : undefined}
              rel={toast.action.external ? "noopener noreferrer" : undefined}
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#9db3ff] hover:text-white"
            >
              {toast.action.label}
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function FirstVisitTooltip({ onDismiss }: { onDismiss: () => void }) {
  const t = useTranslations("app.connect.tooltip");
  const tCommonToasts = useTranslations("common.toasts");
  return (
    <div className="fixed bottom-28 left-1/2 z-[65] w-[min(320px,90vw)] -translate-x-1/2 rounded-2xl border border-[#223253] bg-[#0d162a]/95 px-4 py-3 text-xs text-[var(--muted)] shadow-[0_20px_40px_-25px_rgba(7,10,24,0.9)] backdrop-blur">
      <div className="flex items-start gap-3">
        <span className="text-lg">👆</span>
        <div className="space-y-1 text-left">
          <p className="text-sm font-semibold text-white">{t("swipeOrTap")}</p>
          <p>
            {t("heartsGetNoticed")}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto text-lg leading-none text-white/60 transition hover:text-white"
          aria-label={tCommonToasts("close")}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function MatchAvatar({
  avatarUrl,
  name,
  initials,
}: {
  avatarUrl: string | null;
  name: string;
  initials: string;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-[#2f3f6c] bg-[#111a33]">
      {avatarUrl && !imageError ? (
        <Image 
          src={avatarUrl} 
          alt={name} 
          fill 
          className="object-cover" 
          sizes="80px"
          unoptimized
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-2xl font-semibold text-white">{initials}</span>
      )}
    </div>
  );
}

function MatchCelebration({
  match,
  currentProfileName,
  onClose,
}: {
  match: EnrichedMatch;
  currentProfileName: string;
  onClose: () => void;
}) {
  const t = useTranslations("app.connect.celebration");
  const partnerName = match.partner?.display_name ?? "your match";
  const partnerAvatar = match.partner?.avatar_url ?? null;
  const initials = partnerName.slice(0, 1).toUpperCase();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format time consistently to avoid hydration mismatches
  const formatMatchTime = () => {
    if (!mounted) {
      // Return ISO string during SSR
      try {
        return new Date(match.created_at ?? 0).toISOString();
      } catch {
        return "";
      }
    }
    try {
      return new Date(match.created_at ?? 0).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const matchTime = formatMatchTime();
  const whatsappHref = match.whatsapp_url ?? "/matches";
  const isExternal = Boolean(match.whatsapp_url);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6 backdrop-blur">
      <div className="relative w-full max-w-md overflow-hidden rounded-[36px] border border-[#4336f3]/40 bg-[#080f24]/95 px-8 py-10 text-center shadow-[0_45px_95px_-40px_rgba(5,8,30,0.95)]">
        <ConfettiBurst />
        <MatchAvatar avatarUrl={partnerAvatar} name={partnerName} initials={initials} />
        <p className="mt-4 text-xs uppercase tracking-[0.35em] text-[#9db3ff]">{t("mutualMatch")}</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          {currentProfileName} × {partnerName}
        </h2>
        <p className="mt-3 text-sm text-[var(--muted)]" suppressHydrationWarning>
          {t("bothSaidYes", { time: matchTime })}
        </p>
        <div className="mt-6 space-y-3">
          <Link
            href={whatsappHref}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="block rounded-full bg-[#4336f3] px-5 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[#5448ff]"
          >
            {t("openWhatsApp")}
          </Link>
          <Link
            href="/matches"
            className="block rounded-full border border-[#2f3f6c] px-5 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#9db3ff] hover:border-[#9db3ff]"
          >
            {t("viewFullMatch")}
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#6f7bb0] transition hover:text-white"
        >
          {t("close")}
        </button>
      </div>
    </div>
  );
}

function ConfettiBurst() {
  const pieces = useMemo(() =>
    Array.from({ length: 18 }).map((_, index) => {
      const colors = ["#f6408c", "#4336f3", "#5ef1b5", "#facc15", "#60a5fa"];
      return {
        id: index,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 400}ms`,
        duration: `${6 + Math.random() * 4}s`,
        background: colors[index % colors.length],
        rotation: Math.random() * 360,
        scale: 0.8 + Math.random() * 0.6,
      };
    }),
  []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece absolute top-0 block h-3 w-2 rounded-sm opacity-0"
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            backgroundColor: piece.background,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
          }}
        />
      ))}
    </div>
  );
}

function Coachmark({ onDismiss }: { onDismiss: () => void }) {
  const t = useTranslations("app.connect.coachmark");
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-6 backdrop-blur">
      <div className="w-full max-w-sm space-y-4 rounded-3xl border border-[#273763] bg-[#0b1224] p-6 text-sm text-[var(--muted)]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[#6f7bb0]">{t("howSocialWorks")}</p>
          <h2 className="text-lg font-semibold text-white">{t("connectMatch")}</h2>
        </div>
        <ul className="space-y-3 text-left">
          <li>
            <span className="font-semibold text-white">{t("sendVibe")}</span> {t("sendVibeDescription")}
          </li>
          <li>
            <span className="font-semibold text-white">{t("theyGetNotified")}</span> {t("theyGetNotifiedDescription")}
          </li>
          <li>
            <span className="font-semibold text-white">{t("matchUnlocked")}</span> {t("matchUnlockedDescription")}
          </li>
        </ul>
        <button
          onClick={onDismiss}
          className="w-full rounded-full bg-white/10 py-2 text-sm font-semibold text-white hover:bg-white/20"
        >
          {t("letsVibe")}
        </button>
      </div>
    </div>
  );
}

function useCoachmark(): [boolean, () => void] {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyDismissed = window.localStorage.getItem(COACHMARK_KEY);
    if (!alreadyDismissed) {
      setOpen(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COACHMARK_KEY, "1");
    }
    setOpen(false);
  }, []);

  return [open, dismiss];
}

function HighlightTagList({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-[#3e4d79] bg-[#16203a] px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function extractTagline(bio: string | null): string | null {
  if (!bio) return null;
  const firstSentence = bio
    .split(/[\n.?!]/)
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.length > 0);
  if (!firstSentence) return null;
  return firstSentence.replace(/#[\w-]+/g, "").trim() || null;
}

function extractVibeTags(bio: string): string[] {
  return bio
    .split(/\s+/)
    .filter((word) => word.startsWith("#"))
    .map((word) => word.replace(/[^a-zA-Z0-9#]/g, ""))
    .slice(0, 5);
}

function InteractionSubmit({
  type,
  label,
  icon,
  disabled,
}: {
  type: "like" | "invite";
  label: string;
  icon: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={cn(
        "group flex min-w-[140px] items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
        type === "like"
          ? "bg-[#f6408c] text-white shadow-[0_25px_45px_-30px_rgba(246,64,140,0.9)]"
          : "bg-[#4336f3] text-white shadow-[0_25px_45px_-30px_rgba(67,54,243,0.9)]",
        disabled || pending ? "cursor-not-allowed opacity-70" : "hover:scale-[1.03]",
      )}
    >
      <span className="text-lg">{icon}</span>
      {pending ? "Sending..." : label}
    </button>
  );
}

function SkeletonDeck() {
  return (
    <section className="mt-10 space-y-6">
      <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-hidden pb-6 pl-1 pr-8">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="relative aspect-[10/16] w-[min(320px,82vw)] shrink-0 rounded-[32px] border border-[#1d2946] bg-[#101830]/80"
          >
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1c2747] via-[#141d36] to-[#10162b]" />
            <div className="absolute inset-x-0 bottom-0 rounded-b-[32px] bg-gradient-to-t from-[#0b1224] via-[#0b1224]/80 to-transparent px-5 pb-5 pt-16">
              <div className="space-y-3">
                <div className="h-5 w-28 rounded-full bg-white/10" />
                <div className="h-12 w-full rounded-2xl bg-white/5" />
                <div className="flex gap-2">
                  <div className="h-7 w-16 rounded-full bg-white/5" />
                  <div className="h-7 w-16 rounded-full bg-white/5" />
                </div>
                <div className="h-9 w-full rounded-full bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <span key={index} className="h-1.5 w-8 rounded-full bg-[#1f2b4d]" />
        ))}
      </div>
    </section>
  );
}

