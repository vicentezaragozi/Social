"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n";
import { RedirectLoading } from "@/components/auth/redirect-loading";

export default function AuthCallbackLoadingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_to");

  useEffect(() => {
    // Small delay to show loading animation, then redirect
    const timer = setTimeout(() => {
      if (redirectTo) {
        // Remove locale prefix if present (router.push will add it)
        const pathWithoutLocale = redirectTo.startsWith("/en/") || redirectTo.startsWith("/es/")
          ? redirectTo.slice(3)
          : redirectTo.startsWith("/")
          ? redirectTo
          : `/${redirectTo}`;
        router.push(pathWithoutLocale);
      } else {
        // Fallback - redirect to app
        router.push("/app");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [router, redirectTo]);

  return <RedirectLoading />;
}

