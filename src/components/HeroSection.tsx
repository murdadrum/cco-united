import dynamic from 'next/dynamic'

const HeroCanvas = dynamic(() => import('./HeroCanvas'), { ssr: false })

export default function HeroSection() {
  return (
    <section id="hero">
      <HeroCanvas />
      <div className="hero-bg"></div>
      <div className="hero-content">
        <span className="hero-eyebrow">Cherokee Nation · Community &amp; Cultural Outreach</span>
        <h1 className="hero-title">CCO<br />United</h1>
        <div className="hero-rule"></div>
        <p className="hero-tagline">One Platform. Fourteen Communities.<br />Stronger Together.</p>
        <p className="hero-sub">A living, growing workspace — built by Cherokee Nation, for Cherokee Nation.</p>
        <div className="hero-cta">
          <a href="#about" className="btn-primary">See the Vision →</a>
        </div>
      </div>
      <div className="scroll-cue">
        <span>Explore</span>
        <div className="scroll-line"></div>
      </div>
    </section>
  )
}
