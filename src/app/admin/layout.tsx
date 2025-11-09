import { Suspense } from "react";

import "@/app/globals.css";

import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminMemberships } from "@/lib/supabase/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { memberships, user } = await getAdminMemberships();

  return (
    <AdminShell userEmail={user?.email ?? ""} venues={memberships.map((entry) => entry.venues)}>
      <Suspense fallback={<div className="p-6 text-[var(--muted)]">Loading dashboard…</div>}>
        {children}
      </Suspense>
    </AdminShell>
  );
}

