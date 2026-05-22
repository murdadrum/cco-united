import Nav from '@/components/Nav'
import HeroSection from '@/components/HeroSection'
import AboutSection from '@/components/AboutSection'
import GovernmentSection from '@/components/GovernmentSection'
import ServicesSection from '@/components/ServicesSection'
import NewsSection from '@/components/NewsSection'
import CCOUnitedSection from '@/components/CCOUnitedSection'
import GetInvolvedSection from '@/components/GetInvolvedSection'
import Footer from '@/components/Footer'
import AliWidget from '@/components/AliWidget'
import ScrollTopButton from '@/components/ScrollTopButton'
import RevealObserver from '@/components/RevealObserver'

export default function Home() {
  return (
    <>
      <Nav />
      <HeroSection />
      <AboutSection />
      <GovernmentSection />
      <ServicesSection />
      <NewsSection />
      <CCOUnitedSection />
      <GetInvolvedSection />
      <Footer />
      <ScrollTopButton />
      <AliWidget />
      <RevealObserver />
    </>
  )
}
