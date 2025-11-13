import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Link } from "@/i18n";

import { AdminSignInForm } from "@/components/auth/admin-sign-in-form";
import { SocialWordmark } from "@/components/brand/social-wordmark";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.adminSignIn" });
  return {
    title: t("title"),
  };
}

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminSignInPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth.adminSignIn" });

  // Check if already authenticated as admin
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if user has admin credentials
    const { data: adminCred } = await supabase
      .from("admin_credentials")
      .select("profile_id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (adminCred) {
      redirect(`/${locale}/admin`);
    }
  }

  return (
    <div className="mobile-safe flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-16">
      <div className="w-full max-w-md space-y-8 rounded-[32px] border border-[#1d2946] bg-[var(--surface)]/95 p-8 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.75)] backdrop-blur">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full border border-[#2b3a63] bg-[var(--surface-raised)] px-5 py-2">
            <SocialWordmark compact />
          </div>
          <div className="space-y-2">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#1a2a4a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#6b9eff]">
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              {t("adminAccess")}
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">{t("header.title")}</h1>
            <p className="text-sm text-[var(--muted)]">
              {t("header.description")}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-[#5c2a40] bg-[#301321] px-4 py-3 text-sm text-[#ff8ba7]">
            {error === "invalid_credentials" && t("errors.invalidCredentials")}
            {error === "not_admin" && t("errors.notAdmin")}
            {error === "auth_error" && t("errors.authError")}
          </div>
        )}

        <div className="pt-2">
          <AdminSignInForm />
        </div>

        <div className="flex items-center justify-center text-xs text-[var(--muted)]">
          <Link
            href="/"
            locale={locale}
            className="underline decoration-dotted underline-offset-4 hover:text-white"
          >
            {t("links.guestSignIn")}
          </Link>
        </div>
      </div>
    </div>
  );
}

