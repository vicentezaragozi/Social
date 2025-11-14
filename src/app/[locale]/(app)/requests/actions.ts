"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { publicEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildWhatsAppLink } from "@/lib/util/whatsapp";

const requestSchema = z.object({
  song: z.string().min(2, "Add the song title."),
  artist: z.string().optional(),
  note: z.string().max(200).optional(),
  venueId: z.string().uuid(),
});

export type SongRequestState = {
  error?: string;
  success?: boolean;
  whatsappUrl?: string;
};

export async function submitSongRequest(
  prevState: SongRequestState,
  formData: FormData,
): Promise<SongRequestState> {
  const parseResult = requestSchema.safeParse({
    song: formData.get("song"),
    artist: formData.get("artist") ?? undefined,
    note: formData.get("note") ?? undefined,
    venueId: formData.get("venueId"),
  });

  if (!parseResult.success) {
    return { error: parseResult.error.issues[0]?.message ?? "Invalid request." };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in again." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? "Social Guest";
  const { song, artist, note, venueId } = parseResult.data;

  // Get admin users for this venue and find one with a phone number
  const { data: venueMembers } = await supabase
    .from("venue_memberships")
    .select("user_id")
    .eq("venue_id", venueId)
    .eq("role", "admin")
    .limit(10);

  let adminPhoneNumber: string | undefined;

  if (venueMembers && venueMembers.length > 0) {
    // Get profiles for admin users with phone numbers
    const adminUserIds = venueMembers.map((m) => m.user_id);
    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("phone_number")
      .in("id", adminUserIds)
      .not("phone_number", "is", null)
      .limit(1);

    if (adminProfiles && adminProfiles.length > 0) {
      adminPhoneNumber = adminProfiles[0].phone_number ?? undefined;
    }
  }

  // Fallback to env variable if no admin phone number found
  const targetPhoneNumber = adminPhoneNumber || publicEnv.djWhatsappNumber;

  const messageLines = [
    `Hey DJ! ${displayName} here 👋`,
    `Song request: ${song}`,
  ];

  if (artist) {
    messageLines.push(`Artist: ${artist}`);
  }

  if (note) {
    messageLines.push(`Note: ${note}`);
  }

  const whatsappUrl = buildWhatsAppLink(
    messageLines.join("\n"),
    targetPhoneNumber,
  );

  const { error } = await supabase.from("song_requests").insert({
    profile_id: user.id,
    venue_id: venueId,
    song_title: song,
    artist: artist ?? null,
    status: "pending",
    notes: note ?? null,
    whatsapp_thread_url: whatsappUrl,
  });

  if (error) {
    console.error("Failed to log song request", error);
  } else {
    revalidatePath("/requests");
  }

  return { success: true, whatsappUrl };
}

