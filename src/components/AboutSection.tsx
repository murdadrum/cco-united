export default function AboutSection() {
  return (
    <section id="about">
      <div className="container">
        <div className="about-grid">
          <div className="reveal">
            <span className="section-label">About the Nation</span>
            <h2 className="section-title">The Largest Tribe<br />in the <em>United States</em></h2>
            <div className="gold-rule"></div>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-num">450K+</div>
                <div className="stat-label">Tribal Citizens</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">1839</div>
                <div className="stat-label">Constitutional Governance</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">11,000</div>
                <div className="stat-label">Employees Nationwide</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">$2.16B</div>
                <div className="stat-label">Economic Impact</div>
              </div>
            </div>
          </div>
          <div className="reveal" style={{ transitionDelay: '.15s' }}>
            <div className="problem-box">
              <h3>Our History</h3>
              <p>The Cherokee Nation is a sovereign tribal nation headquartered in Tahlequah, Oklahoma — the
                historic capital of the Cherokee Nation, established in 1839. With more than 450,000 citizens
                worldwide, we are the largest tribe in the United States and one of the original Five Civilized
                Tribes of the southeastern United States.
              </p>
            </div>
            <div className="solution-box">
              <h3>Culture &amp; Language</h3>
              <p>The Cherokee language — ᎠᏂᎩᏚᏩᎩ — is one of the most resilient Indigenous languages in
                North America. Through language programs, cultural events, and community initiatives, the
                Cherokee Nation actively preserves the traditions, arts, and identity that define who we are
                as a people.</p>
            </div>
            <p className="about-closer">The Cherokee Nation is committed to the health, education, and prosperity
              of our citizens — while honoring the culture and sovereignty of our ancestors.</p>
            <div className="about-cta">
              <a href="#government" className="btn-outline">Our Government →</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
