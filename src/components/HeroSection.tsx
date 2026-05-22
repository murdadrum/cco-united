import HeroCanvas from './HeroCanvas'

export default function HeroSection() {
  return (
    <section id="hero">
      <HeroCanvas />
      <div className="hero-bg"></div>
      <div className="hero-content">
        <span className="hero-eyebrow">ᎠᏂᎩᏚᏩᎩ · Anigiduwagi</span>
        <h1 className="hero-title">Cherokee Nation</h1>
        <div className="hero-rule"></div>
        <p className="hero-tagline">Osiyo. Welcome to the<br />Cherokee Nation.</p>
        <p className="hero-sub">Committed to protecting our inherent sovereignty, preserving and promoting Cherokee culture, language and values.</p>
        <div className="hero-cta">
          <a href="#services" className="btn-primary">Explore Services →</a>
          <a href="#about" className="btn-outline" style={{ marginLeft: '1rem' }}>About the Nation →</a>
        </div>
      </div>
      <div className="scroll-cue">
        <span>Explore</span>
        <div className="scroll-line"></div>
      </div>
    </section>
  )
}
