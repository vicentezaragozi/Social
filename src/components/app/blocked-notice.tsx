import type { Database } from "@/lib/supabase/types";
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function BlockedNotice({ profile }: { profile: ProfileRow }) {
  const reason = profile.blocked_reason ?? "You have been blocked by venue staff.";
  let detail = "Contact the staff for more information.";

  if (profile.blocked_until) {
    const until = new Date(profile.blocked_until);
    if (!Number.isNaN(until.getTime())) {
      if (until.getTime() > Date.now()) {
        detail = `Block lifts on ${until.toLocaleString()}.`;
      } else {
        detail = "Block should be lifted soon. Reload or contact staff if it persists.";
      }
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 rounded-3xl border border-[#223253] bg-[#0d162a]/90 p-8 text-center shadow-lg shadow-black/30">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-white">Access temporarily restricted</h2>
        <p className="text-sm text-[var(--muted)]">
          Venue staff set a block on your account. You cannot view the guest feed or send vibes
          until it clears.
        </p>
      </div>
      <div className="space-y-3 rounded-3xl border border-[#553432] bg-[#301321]/70 px-6 py-5 text-left text-sm text-[#ff8ba7]">
        <p className="font-semibold uppercase tracking-[0.3em] text-[#ffb2c5]">Reason</p>
        <p className="text-base text-white">{reason}</p>
        <p className="text-xs text-[var(--muted)]">{detail}</p>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Need help? Show this screen to the venue crew so they can review the block.
      </p>
    </div>
  );
}

