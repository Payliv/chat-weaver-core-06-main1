import { NavigationBar } from "@/components/landing/NavigationBar";
import { HeroSection } from "@/components/landing/HeroSection";
import { UniquePoints } from "@/components/landing/UniquePoints";
import { DetailedFeatures } from "@/components/landing/DetailedFeatures";
import { PricingSection } from "@/components/landing/PricingSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

const NewLanding = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <HeroSection />
      <UniquePoints />
      <DetailedFeatures />
      <PricingSection />
      <Testimonials />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
};

export default NewLanding;