"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type SocialWordmarkProps = {
  asLink?: boolean;
  href?: string;
  className?: string;
  compact?: boolean;
};

export function SocialWordmark({
  asLink = false,
  href = "/app",
  className,
  compact = false,
}: SocialWordmarkProps) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold uppercase tracking-[0.45em]",
        compact ? "text-xs" : "text-sm md:text-base",
        className,
      )}
    >
      <span className="relative flex items-center gap-2">
        <span className="relative">
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(246,64,140,0.45),transparent_70%)] blur-md" />
          <span className="relative flex h-2.5 w-2.5 items-center justify-center rounded-full bg-gradient-to-b from-[#f6408c] to-[#4336f3] shadow-[0_0_12px_rgba(246,64,140,0.6)]" />
        </span>
        <span className="bg-gradient-to-r from-white via-[#f7f2ff] to-[#9fb0ff] bg-clip-text text-transparent">
          Social
        </span>
      </span>
    </span>
  );

  if (asLink) {
    return (
      <Link href={href} className="group inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}


