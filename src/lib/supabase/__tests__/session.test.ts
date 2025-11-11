import { describe, expect, it } from "vitest";

import type { Database } from "../types";
import { isSessionExpired } from "@/lib/session-utils";

type SessionRow = Database["public"]["Tables"]["session_metadata"]["Row"];

const buildSession = (overrides: Partial<SessionRow> = {}): SessionRow => ({
  id: "session-id",
  venue_id: "venue-id",
  session_name: "Test Session",
  session_description: null,
  session_type: "event",
  duration_hours: 1,
  start_time: new Date().toISOString(),
  end_time: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe("isSessionExpired", () => {
  it("returns false when end_time is not set", () => {
    const session = buildSession({ end_time: null });
    expect(isSessionExpired(session)).toBe(false);
  });

  it("returns false when end_time is in the future", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const session = buildSession({ end_time: future });
    expect(isSessionExpired(session)).toBe(false);
  });

  it("returns true when end_time is in the past", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const session = buildSession({ end_time: past });
    expect(isSessionExpired(session)).toBe(true);
  });
});


