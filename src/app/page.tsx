import { Hero } from "@/components/landing/Hero";
import { SpacesSection } from "@/components/landing/SpacesSection";
import { EthosSection } from "@/components/landing/EthosSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { getHeroQuotes } from "@/lib/data";

export default async function HomePage() {
  const heroQuotes = await getHeroQuotes();

  return (
    <>
      <Hero quotes={heroQuotes} />
      <SpacesSection />
      <EthosSection />
      <AboutSection />
    </>
  );
}
