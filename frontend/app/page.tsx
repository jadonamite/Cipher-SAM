import Hero from '@/components/landing/Hero';
import Problem from '@/components/landing/Problem';
import HowItWorks from '@/components/landing/HowItWorks';
import IntelligencePreview from '@/components/landing/IntelligencePreview';
import TrustSection from '@/components/landing/TrustSection';
import CTAFinale from '@/components/landing/CTAFinale';
import Footer from '@/components/landing/Footer';

const landingComponents = [
  <Hero key="hero" />, 
  <Problem key="problem" />, 
  <HowItWorks key="how-it-works" />, 
  <IntelligencePreview key="intelligence-preview" />, 
  <TrustSection key="trust-section" />, 
  <CTAFinale key="cta-finale" />, 
  <Footer key="footer" />
];

export default function Home() {
  return (
    <main className="bg-void">{landingComponents}</main>
  );
}