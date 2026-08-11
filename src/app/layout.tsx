import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { KoinaBar } from "@/components/KoinaBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  ThemeProvider,
  themeInitScript,
} from "@/components/theme/ThemeProvider";
import {
  LocaleProvider,
  localeInitScript,
} from "@/components/i18n/LocaleProvider";
import { getCurrentProfile } from "@/lib/data";
import "./globals.css";

export const dynamic = "force-dynamic";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "KOINA — Shared spaces. Shared interests. Shared purpose.",
  description:
    "KOINA is an open commons for belonging, exploration, and growth together — fellowship through shared participation.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `${themeInitScript}${localeInitScript}`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-base text-ink">
        <ThemeProvider>
          <LocaleProvider>
            <KoinaBar />
            <SiteHeader profile={profile} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
