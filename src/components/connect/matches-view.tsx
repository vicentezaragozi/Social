"use client";

import Link from "next/link";
import Image from "next/image";
import { useFormState } from "react-dom";

import {
  respondInteractionAction,
  type InteractionActionState,
} from "@/app/(app)/app/actions";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type InteractionRow = Database["public"]["Tables"]["interactions"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SlimProfile = Pick<ProfileRow, "id" | "display_name" | "avatar_url" | "bio">;

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

function Avatar({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#273963] bg-[#0d162a] text-lg">
        {alt.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-[#273963]">
      <Image src={src} alt={alt} fill className="object-cover" sizes="48px" />
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
  const [state, formAction] = useFormState(respondInteractionAction, respondInitialState);

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

export function MatchesView(props: MatchesViewProps) {
  const matches = props.matches.map((match) => {
    const partner =
      match.profile_a === props.currentProfileId ? match.profiles_b : match.profiles;
    return { ...match, partner };
  });

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 pb-32 pt-10 text-white">
      <header className="mb-8 space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
          Requests & Matches
        </p>
        <h1 className="text-2xl font-semibold">Keep the energy flowing</h1>
        <p className="text-sm text-[var(--muted)]">
          Respond to invites, check your matches, and jump straight into WhatsApp when it clicks.
        </p>
        <p className="text-xs text-[var(--muted)]">
          Magic links go to <span className="text-white">{props.sessionEmail}</span>
        </p>
      </header>

      <section className="space-y-5">
        <div className="space-y-4 rounded-3xl border border-[#223253] bg-[#0d162a] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Incoming invites</h2>
            <span className="rounded-full border border-[#223253] px-3 py-1 text-xs text-[var(--muted)]">
              {props.pendingIncoming.length}
            </span>
          </div>
          {props.pendingIncoming.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No new invites yet. They&apos;ll show up here when someone sends you a heart or
              invite.
            </p>
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
                      <Avatar src={guest.avatar_url} alt={guest.display_name} />
                      <div>
                        <p className="text-sm font-semibold">{guest.display_name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {interaction.interaction_type === "invite"
                            ? "They sent you an invite."
                            : "They dropped a heart."}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <RespondForm interactionId={interaction.id} action="decline">
                        Pass
                      </RespondForm>
                      <RespondForm interactionId={interaction.id} action="accept">
                        Accept
                      </RespondForm>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-4 rounded-3xl border border-[#223253] bg-[#0d162a] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Your matches</h2>
            <span className="rounded-full border border-[#223253] px-3 py-1 text-xs text-[var(--muted)]">
              {matches.length}
            </span>
          </div>

          {matches.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Once you both accept, your match and a WhatsApp link will pop up here.
            </p>
          ) : (
            <ul className="space-y-4">
              {matches.map((match) => {
                const partner = match.partner;
                if (!partner) return null;
                return (
                  <li
                    key={match.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[#223253] bg-[#101b33] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={partner.avatar_url} alt={partner.display_name} />
                      <div>
                        <p className="text-sm font-semibold">{partner.display_name}</p>
                        <p className="text-xs text-[var(--muted)]">Match unlocked tonight</p>
                      </div>
                    </div>
                    <Link
                      href={match.whatsapp_url ?? "#"}
                      target="_blank"
                      className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--accent-strong)]"
                    >
                      Open WhatsApp
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-4 rounded-3xl border border-[#223253] bg-[#0d162a] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">You reached out</h2>
            <span className="rounded-full border border-[#223253] px-3 py-1 text-xs text-[var(--muted)]">
              {props.pendingOutgoing.length}
            </span>
          </div>
          {props.pendingOutgoing.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Hearts and invites you send will show up here with their status.
            </p>
          ) : (
            <ul className="space-y-2">
              {props.pendingOutgoing.map((interaction) => {
                const guest = interaction.receiver;
                if (!guest) return null;
                return (
                  <li
                    key={interaction.id}
                    className="flex items-center justify-between rounded-2xl border border-[#223253] bg-[#101b33] px-4 py-3 text-xs text-[var(--muted)]"
                  >
                    <span className="flex items-center gap-3">
                      <Avatar src={guest.avatar_url} alt={guest.display_name} />
                      <span>
                        <span className="text-white">{guest.display_name}</span>
                        <span className="ml-2">
                          — {interaction.interaction_type === "invite" ? "Invite" : "Heart"}{" "}
                          {interaction.status === "accepted" ? "accepted" : "sent"}
                        </span>
                      </span>
                    </span>
                    {interaction.status === "accepted" ? (
                      <Link
                        href="/app"
                        className="rounded-xl border border-[#2f9b7a] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5ef1b5]"
                      >
                        View feed
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

