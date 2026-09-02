import LaunchBanner from "../components/sections/LaunchBanner";
import Hero from "../components/sections/Hero";
import ServicesSection from "../components/sections/ServicesSection";
import StorySection from "../components/sections/StorySection";
import TrustSection from "../components/sections/TrustSection";
import PromiseSection from "../components/sections/PromiseSection";
import HowItWorksSection from "../components/sections/HowItWorksSection";
import DemoSection from "../components/sections/DemoSection";
import AudienceSection from "../components/sections/AudienceSection";
import CityExpansionSection from "../components/sections/CityExpansionSection";
import PartnerSection from "../components/sections/PartnerSection";
import AppComingSoonSection from "../components/sections/AppComingSoonSection";
import FaqSection from "../components/sections/FaqSection";
import InvestorSection from "../components/sections/InvestorSection";
import ComplaintSection from "../components/sections/ComplaintSection";
import TermsSection from "../components/sections/TermsSection";
import PrivacySection from "../components/sections/PrivacySection";
import FinalCtaSection from "../components/sections/FinalCtaSection";

// Home is the full one-page marketing site — mirrors the reference site's
// section-per-anchor structure (#services, #story, #how, #demo, #trust, #faq,
// #join) plus the supporting sections (audience, city waitlist, app-coming-soon,
// investor, complaint intake, terms, privacy) that round out the same flow.
export default function Home() {
  return (
    <div>
      <LaunchBanner />
      <Hero />
      <ServicesSection />
      <StorySection />
      <TrustSection />
      <PromiseSection />
      <HowItWorksSection />
      <DemoSection />
      <AudienceSection />
      <CityExpansionSection />
      <PartnerSection />
      <AppComingSoonSection />
      <FaqSection />
      <InvestorSection />
      <ComplaintSection />
      <TermsSection />
      <PrivacySection />
      <FinalCtaSection />
    </div>
  );
}
