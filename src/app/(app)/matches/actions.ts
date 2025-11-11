"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const unmatchSchema = z.object({
  matchId: z.string().uuid(),
});

const blockSchema = z.object({
  blockedUserId: z.string().uuid(),
});

export type MatchActionState = {
  error?: string;
  success?: boolean;
};

export async function unmatchAction(
  prevState: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  const parseResult = unmatchSchema.safeParse({
    matchId: formData.get("matchId"),
  });

  if (!parseResult.success) {
    return { error: "Invalid match ID." };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in again." };
  }

  // Verify the match belongs to the current user
  const { data: match } = await supabase
    .from("matches")
    .select("id, profile_a, profile_b")
    .eq("id", parseResult.data.matchId)
    .maybeSingle();

  if (!match) {
    return { error: "Match not found." };
  }

  if (match.profile_a !== user.id && match.profile_b !== user.id) {
    return { error: "You can only unmatch your own matches." };
  }

  // Delete the match
  const { error: deleteError } = await supabase
    .from("matches")
    .delete()
    .eq("id", parseResult.data.matchId);

  if (deleteError) {
    console.error("Failed to unmatch", deleteError);
    return { error: "Could not unmatch. Try again." };
  }

  revalidatePath("/matches");
  revalidatePath("/app");
  return { success: true };
}

export async function blockUserAction(
  prevState: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  const parseResult = blockSchema.safeParse({
    blockedUserId: formData.get("blockedUserId"),
  });

  if (!parseResult.success) {
    return { error: "Invalid user ID." };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in again." };
  }

  if (user.id === parseResult.data.blockedUserId) {
    return { error: "You cannot block yourself." };
  }

  // Create block record
  const { error: blockError } = await supabase.from("blocks").insert({
    blocker_id: user.id,
    blocked_id: parseResult.data.blockedUserId,
  });

  if (blockError) {
    console.error("Failed to block user", blockError);
    // Check if already blocked
    if (blockError.code === "23505") {
      return { error: "User is already blocked." };
    }
    return { error: "Could not block user. Try again." };
  }

  // Also unmatch if they have a match
  const { data: matches } = await supabase
    .from("matches")
    .select("id")
    .or(
      `and(profile_a.eq.${user.id},profile_b.eq.${parseResult.data.blockedUserId}),and(profile_a.eq.${parseResult.data.blockedUserId},profile_b.eq.${user.id})`,
    );

  if (matches && matches.length > 0) {
    await supabase.from("matches").delete().in(
      "id",
      matches.map((m) => m.id),
    );
  }

  revalidatePath("/matches");
  revalidatePath("/app");
  return { success: true };
}

