import Hero from '@/components/landing/Hero'
import Problem from '@/components/landing/Problem'
import HowItWorks from '@/components/landing/HowItWorks'
import IntelligencePreview from '@/components/landing/IntelligencePreview'
import TrustSection from '@/components/landing/TrustSection'
import CTAFinale from '@/components/landing/CTAFinale'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    // FIXME: handle edge case when value is null
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
