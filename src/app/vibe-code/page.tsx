import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans } from "next/font/google";
import { VibeCodeFlyer } from "@/components/vibe-code/VibeCodeFlyer";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["400", "700", "800"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Vibe Code — Arise Asia Workshop | KOINA",
  description:
    "Dream it. Build it. Ship it. Free 4-night online workshop — no coding experience needed.",
};

export default function VibeCodePage() {
  return (
    <div
      className={`${bricolage.variable} ${ibmPlexSans.variable} bg-[#05081A] px-4 py-8 md:py-12`}
    >
      <VibeCodeFlyer />
    </div>
  );
}
