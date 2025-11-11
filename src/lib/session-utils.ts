import type { Database } from "@/lib/supabase/types";

type SessionMetadataRow = Database["public"]["Tables"]["session_metadata"]["Row"];

export const isSessionExpired = (session: SessionMetadataRow, reference = new Date()) => {
  if (!session.end_time) return false;
  return new Date(session.end_time).getTime() <= reference.getTime();
};


