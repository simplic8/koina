import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/components/i18n/T";
import { Hack2026Sheet } from "@/components/vibe-code/Hack2026Sheet";

export const metadata: Metadata = {
  title: "One Hour, One Live App — #HACK 2026 | KOINA",
  description:
    "60-minute #HACK 2026 workshop run sheet — one prompt, one live app on the internet.",
};

export default function VibeCodeHack2026Page() {
  return (
    <div className="flex min-h-[calc(100vh-68px)] flex-col bg-[#0A0D18]">
      <div className="border-b border-[#2A3352] bg-[#141A2E] px-4 py-3 text-center text-sm text-[#E9ECF7] md:px-6">
        <T k="vibe.hackBanner" />{" "}
        <Link
          href="/vibe-code"
          className="font-semibold text-[#4FD3C4] underline-offset-2 hover:underline"
        >
          <T k="vibe.hackBannerLink" />
        </Link>
      </div>
      <Hack2026Sheet />
    </div>
  );
}
