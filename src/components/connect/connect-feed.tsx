"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useFormState } from "react-dom";

import { sendInteractionAction, type InteractionActionState } from "@/app/(app)/app/actions";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type SessionWithProfile =
  Database["public"]["Tables"]["venue_sessions"]["Row"] & {
    profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  };

type InteractionRow = Database["public"]["Tables"]["interactions"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

type ConnectFeedProps = {
  currentProfile: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
  };
  venue: {
    id: string;
    name: string;
  };
  activeSessionId: string;
  attendees: SessionWithProfile[];
  outgoingInteractions: InteractionRow[];
  incomingInteractions: InteractionRow[];
  matches: MatchRow[];
  sessionEmail: string;
};

const interactionInitialState: InteractionActionState = {};

type InteractionButtonProps = {
  receiverId: string;
  sessionId: string;
  type: "like" | "invite";
  label: string;
  disabled?: boolean;
  subtle?: boolean;
};

function InteractionButton({
  receiverId,
  sessionId,
  type,
  label,
  disabled,
  subtle,
}: InteractionButtonProps) {
  const [state, formAction] = useFormState(sendInteractionAction, interactionInitialState);

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="receiverId" value={receiverId} />
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="type" value={type} />
      <button
        type="submit"
        disabled={disabled}
        className={cn(
          "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          subtle
            ? "border border-[#273963] bg-transparent text-[var(--muted)] hover:border-[var(--accent)] hover:text-white disabled:border-[#273963] disabled:text-[#3c4a6d]"
            : "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] disabled:bg-[#332a58] disabled:text-[#8078a1]",
        )}
      >
        {label}
      </button>
      {state.error ? (
        <p className="mt-2 text-center text-xs text-[#ff8ba7]">{state.error}</p>
      ) : null}
    </form>
  );
}

function Avatar({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#273963] bg-[#0d162a] text-xl">
        {alt.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[#273963]">
      <Image src={src} alt={alt} fill className="object-cover" sizes="64px" />
    </div>
  );
}

export function ConnectFeed(props: ConnectFeedProps) {
  const groupedOutgoing = useMemo(() => {
    const map = new Map<string, Partial<Record<"like" | "invite", InteractionRow>>>();
    props.outgoingInteractions.forEach((interaction) => {
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

  const matchedProfiles = useMemo(() => {
    const set = new Set<string>();
    props.matches.forEach((match) => {
      const partner =
        match.profile_a === props.currentProfile.id ? match.profile_b : match.profile_a;
      if (partner) {
        set.add(partner);
      }
    });
    return set;
  }, [props.matches, props.currentProfile.id]);

  const attendeeCards = useMemo(() => {
    return props.attendees
      .map((session) => {
        const profile = session.profiles;
        if (!profile) {
          return null;
        }

        const outgoing = groupedOutgoing.get(profile.id) ?? {};
        const incoming = groupedIncoming.get(profile.id) ?? [];
        const theyLikedYou = incoming.some((interaction) => interaction.status === "pending");
        const matched = matchedProfiles.has(profile.id);

        return {
          sessionId: session.id,
          profileId: profile.id,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          bio: profile.bio,
          likedByMe: Boolean(outgoing.like),
          invitedByMe: Boolean(outgoing.invite),
          theyLikedYou,
          matched,
        };
      })
      .filter(Boolean) as Array<{
      sessionId: string;
      profileId: string;
      displayName: string;
      avatarUrl: string | null;
      bio: string | null;
      likedByMe: boolean;
      invitedByMe: boolean;
      theyLikedYou: boolean;
      matched: boolean;
    }>;
  }, [groupedOutgoing, groupedIncoming, matchedProfiles, props.attendees]);

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 pb-32 pt-10 text-white">
      <header className="mb-8 space-y-3">
        <div className="flex items-center gap-3 rounded-3xl border border-[#223253] bg-[#0d162a] px-5 py-3">
          <Avatar src={props.currentProfile.avatarUrl} alt={props.currentProfile.displayName} />
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
              You&apos;re live at
            </p>
            <p className="text-lg font-semibold text-white">{props.venue.name}</p>
            <p className="text-xs text-[var(--muted)]">{props.sessionEmail}</p>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Connect with the floor</h1>
          <p className="text-sm text-[var(--muted)]">
            Send a quick heart to show interest or drop an invite. If they vibe back, your WhatsApp
            link unlocks instantly.
          </p>
        </div>
      </header>

      {attendeeCards.length === 0 ? (
        <div className="rounded-3xl border border-[#223253] bg-[#0d162a] px-5 py-12 text-center text-sm text-[var(--muted)]">
          No other guests are live yet. Grab a drink, we&apos;ll light this up once more people
          check in.
        </div>
      ) : (
        <section className="space-y-5">
          {attendeeCards.map((attendee) => (
            <article
              key={attendee.profileId}
              className="space-y-5 rounded-3xl border border-[#223253] bg-[#0d162a] p-6 shadow-lg shadow-black/20"
            >
              <div className="flex items-start gap-4">
                <Avatar src={attendee.avatarUrl} alt={attendee.displayName} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{attendee.displayName}</h2>
                    {attendee.matched ? (
                      <span className="rounded-full border border-[#2f9b7a] bg-[#132822] px-3 py-1 text-xs text-[#5ef1b5]">
                        Matched
                      </span>
                    ) : null}
                    {attendee.theyLikedYou && !attendee.matched ? (
                      <span className="rounded-full border border-[#70551f] bg-[#241b09] px-3 py-1 text-xs text-[#ffb224]">
                        They&apos;re waiting
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {attendee.bio?.length ? attendee.bio : "No bio yet — break the ice first."}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InteractionButton
                  receiverId={attendee.profileId}
                  sessionId={props.activeSessionId}
                  type="like"
                  label={attendee.likedByMe ? "Heart sent" : "Send a heart"}
                  disabled={attendee.likedByMe || attendee.matched}
                />
                <InteractionButton
                  receiverId={attendee.profileId}
                  sessionId={props.activeSessionId}
                  type="invite"
                  label={attendee.invitedByMe ? "Invite sent" : "Send invite"}
                  disabled={attendee.invitedByMe || attendee.matched}
                  subtle
                />
              </div>

              {attendee.theyLikedYou && !attendee.matched ? (
                <div className="rounded-2xl border border-[#70551f] bg-[#241b09] px-4 py-3 text-xs text-[#ffb224]">
                  They&apos;ve already reached out. Check your{" "}
                  <Link
                    href="/matches"
                    className="font-semibold text-white underline-offset-4 hover:underline"
                  >
                    matches
                  </Link>{" "}
                  to accept or keep the night moving.
                </div>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

