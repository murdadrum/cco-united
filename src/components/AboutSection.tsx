export default function AboutSection() {
  return (
    <section id="about">
      <div className="container">
        <div className="about-grid">
          <div className="reveal">
            <span className="section-label">What We&apos;re Solving</span>
            <h2 className="section-title">The Problem<br />We&apos;re <em>Solving</em></h2>
            <div className="gold-rule"></div>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-num">14</div>
                <div className="stat-label">CCO Organizations</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">501(c)(3)</div>
                <div className="stat-label">Tax-Exempt Status</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">1</div>
                <div className="stat-label">Unified Workspace</div>
              </div>
              <div className="stat-card">
                <div className="stat-num infinity">∞</div>
                <div className="stat-label">Community Impact</div>
              </div>
            </div>
          </div>
          <div className="reveal" style={{ transitionDelay: '.15s' }}>
            <div className="problem-box">
              <h3>The Challenge</h3>
              <p>Cherokee Nation&apos;s CCO groups are doing critical work — but we&apos;re doing it in silos. Duplicated effort.
                Disconnected data. Grant opportunities missed. Resources unknown to the communities that need them most.
              </p>
            </div>
            <div className="solution-box">
              <h3>The Solution</h3>
              <p>CCO United is the solution: a centralized, intelligent platform purpose-built for Cherokee Nation&apos;s
                fourteen Community &amp; Cultural Outreach organizations. It standardizes operations, consolidates
                resources, and gives every CCO the tools to operate with the efficiency and impact of an organization ten
                times their size.</p>
            </div>
            <p className="about-closer">CCO United isn&apos;t just a website. It&apos;s a system for the continued success of our
              thriving community.</p>
            <div className="about-cta">
              <a href="#building" className="btn-outline">Explore the Platform →</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
