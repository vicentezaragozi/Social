"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useState, useEffect } from "react";
import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { cn } from "@/lib/utils";
import { buildWhatsAppLink } from "@/lib/util/whatsapp";

import {
  respondInteractionAction,
  type InteractionActionState,
} from "@/app/[locale]/(app)/app/actions";
import {
  unmatchAction,
  blockUserAction,
  type MatchActionState,
} from "@/app/[locale]/(app)/matches/actions";
import type { Database } from "@/lib/supabase/types";

type InteractionRow = Database["public"]["Tables"]["interactions"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SlimProfile = Pick<
  ProfileRow,
  "id" | "display_name" | "avatar_url" | "bio" | "gallery_urls" | "phone_number" | "blocked_until" | "blocked_reason"
>;

type MatchRow =
  Database["public"]["Tables"]["matches"]["Row"] & {
    profiles: SlimProfile | null;
    profiles_b: SlimProfile | null;
  };

type MatchesViewProps = {
  currentProfileId: string;
  sessionEmail: string;
  pendingIncoming: Array<InteractionRow & { sender: SlimProfile | null }>;
  pendingOutgoing: Array<InteractionRow & { receiver: SlimProfile | null }>;
  matches: MatchRow[];
};

const respondInitialState: InteractionActionState = {};
const matchActionInitialState: MatchActionState = {};

const isProfileBlocked = (profile?: { blocked_until?: string | null } | null) => {
  if (!profile?.blocked_until) return false;
  const until = new Date(profile.blocked_until);
  return !Number.isNaN(until.getTime()) && until.getTime() > Date.now();
};

const BlockedBadge = ({ profile }: { profile: SlimProfile | null }) => {
  const t = useTranslations("common.status");
  if (!profile || !isProfileBlocked(profile)) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#553432] bg-[#301321] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ff8ba7]">
      {t("blocked")}
    </span>
  );
};

function MatchActionsMenu({
  matchId,
  partnerId,
  partnerName,
}: {
  matchId: string;
  partnerId: string;
  partnerName: string;
}) {
  const t = useTranslations("app.matches");
  const tActions = useTranslations("app.matches.actions");
  const tConfirmations = useTranslations("app.matches.confirmations");
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState<"unmatch" | "block" | null>(null);
  const [unmatchState, unmatchFormAction] = useActionState(unmatchAction, matchActionInitialState);
  const [blockState, blockFormAction] = useActionState(blockUserAction, matchActionInitialState);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-white/5 hover:text-white"
        aria-label={tActions("matchOptions")}
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-[#223253] bg-[#0d162a] py-1 shadow-xl">
            <button
              onClick={() => {
                setShowConfirm("unmatch");
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--muted)] transition hover:bg-white/5 hover:text-white"
            >
              <span>🔓</span>
              <span>{tActions("unmatch")}</span>
            </button>
            <button
              onClick={() => {
                setShowConfirm("block");
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#ff8ba7] transition hover:bg-white/5 hover:text-[#ff6b6b]"
            >
              <span>🚫</span>
              <span>{tActions("blockUser")}</span>
            </button>
          </div>
        </>
      )}

      {showConfirm === "unmatch" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur">
          <div className="w-full max-w-sm space-y-4 rounded-3xl border border-[#273763] bg-[#0b1224] p-6">
            <h3 className="text-lg font-semibold text-white">{tConfirmations("unmatchTitle", { name: partnerName })}</h3>
            <p className="text-sm text-[var(--muted)]">
              {tConfirmations("unmatchDescription")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 rounded-2xl border border-[#223253] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:border-white/30 hover:text-white"
              >
                {tConfirmations("cancel")}
              </button>
              <form action={unmatchFormAction} className="flex-1">
                <input type="hidden" name="matchId" value={matchId} />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                >
                  {tActions("unmatch")}
                </button>
              </form>
            </div>
            {unmatchState.error && (
              <p className="text-center text-xs text-[#ff8ba7]">{unmatchState.error}</p>
            )}
          </div>
        </div>
      )}

      {showConfirm === "block" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur">
          <div className="w-full max-w-sm space-y-4 rounded-3xl border border-[#273763] bg-[#0b1224] p-6">
            <h3 className="text-lg font-semibold text-white">{tConfirmations("blockTitle", { name: partnerName })}</h3>
            <p className="text-sm text-[var(--muted)]">
              {tConfirmations("blockDescription")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 rounded-2xl border border-[#223253] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:border-white/30 hover:text-white"
              >
                {tConfirmations("cancel")}
              </button>
              <form action={blockFormAction} className="flex-1">
                <input type="hidden" name="blockedUserId" value={partnerId} />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-[#ff6b6b] to-[#ee5a6f] px-4 py-2 text-sm font-semibold text-white transition hover:from-[#ff8080] hover:to-[#ff6b6b]"
                >
                  {tConfirmations("block")}
                </button>
              </form>
            </div>
            {blockState.error && (
              <p className="text-center text-xs text-[#ff8ba7]">{blockState.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ 
  src, 
  alt, 
  galleryUrls 
}: { 
  src: string | null; 
  alt: string;
  galleryUrls?: string[];
}) {
  const [imageError, setImageError] = React.useState(false);
  
  // Prioritize gallery photo over avatar
  const imageUrl = (galleryUrls && galleryUrls.length > 0) ? galleryUrls[0] : src;
  
  if (!imageUrl || imageError) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#273963] bg-[#0d162a] text-lg">
        {alt.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-[#273963]">
      <Image 
        src={imageUrl} 
        alt={alt} 
        fill 
        className="object-cover" 
        sizes="48px"
        unoptimized
        onError={() => setImageError(true)}
      />
    </div>
  );
}

function RespondForm({
  interactionId,
  action,
  className,
  children,
}: {
  interactionId: string;
  action: "accept" | "decline";
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(respondInteractionAction, respondInitialState);
  const router = useRouter();

  // When accepting a vibe successfully, refresh and navigate to connect page to show match celebration
  useEffect(() => {
    if (state.success && action === "accept") {
      // Refresh first to get the new match data, then navigate
      router.refresh();
      // Small delay to ensure server has processed the match and data is refreshed
      const timer = setTimeout(() => {
        // Navigate to connect page to show match celebration modal
        router.push("/app");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state.success, action, router]);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="interactionId" value={interactionId} />
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        className={cn(
          "rounded-2xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition",
          action === "accept"
            ? "border-[#2f9b7a] bg-[#122521] text-[#5ef1b5] hover:border-[#5ef1b5] hover:text-white"
            : "border-[#553432] bg-[#231113] text-[#ff8ba7] hover:border-[#ff8ba7] hover:text-white",
          className,
        )}
      >
        {children}
      </button>
      {state.error ? (
        <p className="text-center text-xs text-[#ff8ba7]">{state.error}</p>
      ) : null}
    </form>
  );
}

type TabType = "incoming" | "matches" | "sent";

export function MatchesView(props: MatchesViewProps) {
  const t = useTranslations("app.matches");
  const tHeader = useTranslations("app.matches.header");
  const tTabs = useTranslations("app.matches.tabs");
  const tIncoming = useTranslations("app.matches.incoming");
  const tMatches = useTranslations("app.matches.matches");
  const tSent = useTranslations("app.matches.sent");
  const tActions = useTranslations("app.matches.actions");
  const tWhatsApp = useTranslations("app.matches.whatsapp");
  const [activeTab, setActiveTab] = useState<TabType>("incoming");
  
  const matches = props.matches.map((match) => {
    const partner =
      match.profile_a === props.currentProfileId ? match.profiles_b : match.profiles;
    return { ...match, partner };
  });

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "incoming", label: tTabs("incoming"), count: props.pendingIncoming.length },
    { id: "matches", label: tTabs("matches"), count: matches.length },
    { id: "sent", label: tTabs("sent"), count: props.pendingOutgoing.length },
  ];

  return (
    <main className="mobile-safe min-h-screen bg-[var(--background)] text-white">
      <div className="px-4 pb-32 pt-10">
        <header className="mb-6 space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
          {tHeader("subtitle")}
        </p>
        <h1 className="text-2xl font-semibold">{tHeader("title")}</h1>
        <p className="text-sm text-[var(--muted)]">
          {tHeader("description")}
        </p>
        <p className="text-xs text-[var(--muted)]">
          {tHeader("magicLinksGoTo")} <span className="text-white">{props.sessionEmail}</span>
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-2xl border px-4 py-2 text-sm font-semibold transition",
              activeTab === tab.id
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-white"
                : "border-[#223253] bg-[#0d162a] text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-white"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                activeTab === tab.id
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[#223253] text-[var(--muted)]"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
          </div>

      {/* Tab Content */}
      <section className="space-y-4">
        {/* Incoming Vibes Tab */}
        {activeTab === "incoming" && (
          <div className="space-y-4 rounded-3xl border border-[#223253] bg-[#0d162a] p-6 shadow-lg shadow-black/25">
          {props.pendingIncoming.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mb-3 text-4xl">💫</div>
            <p className="text-sm text-[var(--muted)]">
                  {tIncoming("empty")}
            </p>
              </div>
          ) : (
            <ul className="space-y-4">
          {props.pendingIncoming.map((interaction) => {
            const guest = interaction.sender;
                if (!guest) return null;
                return (
                  <li
                    key={interaction.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[#223253] bg-[#101b33] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                        <Avatar src={guest.avatar_url} alt={guest.display_name} galleryUrls={guest.gallery_urls ?? []} />
                      <div>
                        <p className="text-sm font-semibold">{guest.display_name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-[var(--muted)]">{tIncoming("sentYouVibe")}</p>
                          <BlockedBadge profile={guest} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <RespondForm interactionId={interaction.id} action="decline">
                        {tActions("pass")}
                      </RespondForm>
                      <RespondForm interactionId={interaction.id} action="accept">
                        {tActions("accept")}
                      </RespondForm>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        )}

        {/* Matches Tab */}
        {activeTab === "matches" && (
        <div className="space-y-4 rounded-3xl border border-[#223253] bg-[#0d162a] p-6 shadow-lg shadow-black/25">
          {matches.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mb-3 text-4xl">✨</div>
            <p className="text-sm text-[var(--muted)]">
                  {tMatches("empty")}
            </p>
              </div>
          ) : (
            <ul className="space-y-4">
              {matches.map((match) => {
                const partner = match.partner;
                if (!partner) return null;
                  const matchTimestamp = new Date(match.created_at ?? 0).toLocaleString([], {
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  
                  // Build WhatsApp link with partner's phone number if available
                  let whatsappHref: string;
                  let isExternal = true;
                  if (partner.phone_number) {
                    const whatsappMessage = tWhatsApp("messageTemplate");
                    whatsappHref = buildWhatsAppLink(whatsappMessage, partner.phone_number);
                  } else {
                    // Fallback to stored URL or show warning
                    whatsappHref = match.whatsapp_url ?? "/matches";
                    isExternal = Boolean(match.whatsapp_url);
                  }
                return (
                  <li
                    key={match.id}
                      className="flex flex-col gap-3 rounded-2xl border border-[#223253] bg-[#101b33] p-4"
                  >
                      <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                          <Avatar src={partner.avatar_url} alt={partner.display_name} galleryUrls={partner.gallery_urls ?? []} />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">{partner.display_name}</p>
                              <BlockedBadge profile={partner} />
                            </div>
                            <p className="text-xs text-[var(--muted)]">{tMatches("matched", { time: matchTimestamp })}</p>
                          </div>
                      </div>
                        <MatchActionsMenu
                          matchId={match.id}
                          partnerId={partner.id}
                          partnerName={partner.display_name}
                        />
                    </div>
                    <Link
                        href={whatsappHref}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#20BA5A] px-5 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-lg shadow-[#25D366]/30 transition hover:from-[#2AE371] hover:to-[#25D366] hover:shadow-xl hover:shadow-[#25D366]/40"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        {tMatches("messageOnWhatsApp")}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        )}

        {/* Sent Vibes Tab */}
        {activeTab === "sent" && (
        <div className="space-y-4 rounded-3xl border border-[#223253] bg-[#0d162a] p-6 shadow-lg shadow-black/25">
          {props.pendingOutgoing.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mb-3 text-4xl">🌊</div>
            <p className="text-sm text-[var(--muted)]">
                  {tSent("empty")}
            </p>
              </div>
          ) : (
              <ul className="space-y-3">
              {props.pendingOutgoing.map((interaction) => {
                const guest = interaction.receiver;
                if (!guest) return null;
                return (
                  <li
                    key={interaction.id}
                      className="flex items-center gap-3 rounded-2xl border border-[#223253] bg-[#101b33] px-4 py-3"
                  >
                      <Avatar src={guest.avatar_url} alt={guest.display_name} galleryUrls={guest.gallery_urls ?? []} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{guest.display_name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-[var(--muted)]">
                            {tSent("sentVibeTo")} {interaction.status === "accepted" ? tSent("accepted") : tSent("pending")}
                          </p>
                          <BlockedBadge profile={guest} />
                        </div>
                      </div>
                      {interaction.status === "accepted" && (
                        <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                          Matched!
                        </span>
                      )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        )}
      </section>
      </div>
    </main>
  );
}

