import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PartnersSection from "@/components/PartnersSection";
import FeaturesSection from "@/components/FeaturesSection";
import WorkflowSection from "@/components/WorkflowSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialSection from "@/components/TestimonialSection";
import SolutionsSection from "@/components/SolutionsSection";
import BottomCTASection from "@/components/BottomCTASection";
import CTASection from "@/components/CTASection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <PartnersSection />
      <FeaturesSection />
      <WorkflowSection />
      <HowItWorksSection />
      <TestimonialSection />
      <SolutionsSection />
      <BottomCTASection />
      <CTASection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
