import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { requireAuthSession, signOutAction } from "@/lib/supabase/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.signOut" });
  return {
    title: t("title"),
  };
}

export default async function AdminSignOutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { user } = await requireAuthSession();
  const t = await getTranslations({ locale, namespace: "admin.signOut" });

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-200px)] w-full max-w-xl flex-col items-center justify-center px-4 py-16 text-center text-white">
      <div className="w-full space-y-6 rounded-[32px] border border-white/10 bg-[#0b142c]/80 px-8 py-10 shadow-[0_30px_60px_-35px_rgba(4,9,24,0.8)] backdrop-blur">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#8a96c2]">{t("signedInAs")}</p>
          <h1 className="break-words text-xl font-semibold text-white">{user.email ?? "Admin"}</h1>
          <p className="text-sm text-[#919bc5]">
            {t("description")}
          </p>
        </div>

        <form action={signOutAction} className="space-y-4">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-[#f6408c] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[#ff5aa0]"
          >
            {t("button")}
          </button>
        </form>

        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9db3ff] transition hover:border-white/30 hover:text-white"
        >
          {t("cancel")}
        </Link>
      </div>
    </main>
  );
}

