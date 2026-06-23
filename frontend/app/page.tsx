import CTAFinale from '@/components/landing/CTAFinale'
import Footer from '@/components/landing/Footer'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import IntelligencePreview from '@/components/landing/IntelligencePreview'
import Problem from '@/components/landing/Problem'
import TrustSection from '@/components/landing/TrustSection'

export default function Home() {
  return (
    <main className="bg-void">
      <Hero />
      <Problem />
      <HowItWorks />
      <IntelligencePreview />
      <TrustSection />
      <CTAFinale />
      <Footer />
    </main>
  )
}
