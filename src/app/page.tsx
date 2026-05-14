import Nav from '@/components/Nav'
import HeroSection from '@/components/HeroSection'
import AboutSection from '@/components/AboutSection'
import BuildingSection from '@/components/BuildingSection'
import GetInvolvedSection from '@/components/GetInvolvedSection'
import Footer from '@/components/Footer'
import AliWidget from '@/components/AliWidget'
import ScrollTopButton from '@/components/ScrollTopButton'

export default function Home() {
  return (
    <>
      <Nav />
      <HeroSection />
      <AboutSection />
      <BuildingSection />
      <GetInvolvedSection />
      <Footer />
      <ScrollTopButton />
      <AliWidget />
    </>
  )
}
