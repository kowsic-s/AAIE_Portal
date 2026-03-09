import LandingNavbar from '../components/landing/Navbar'
import HeroSection from '../components/landing/HeroSection'
import HowItWorks from '../components/landing/HowItWorks'
import FeaturesSection from '../components/landing/FeaturesSection'
import PortalsSection from '../components/landing/PortalsSection'
import MLSection from '../components/landing/MLSection'
import CTASection from '../components/landing/CTASection'
import Footer from '../components/landing/Footer'
import PageBackground from '../components/ui/PageBackground'

const STATIC_STATS = {
  totalStudents: 1284,
  atRisk: 142,
  interventions: 38,
  departments: 4,
  modelConfidence: 87.4,
  riskRecall: 92,
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen" style={{ background: 'var(--lp-bg)', color: 'var(--lp-text-1)' }}>
      <PageBackground />
      <div className="relative z-[1]">
        <LandingNavbar />
        <main>
          <HeroSection stats={STATIC_STATS} />
          <HowItWorks />
          <FeaturesSection />
          <PortalsSection />
          <MLSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </div>
  )
}
