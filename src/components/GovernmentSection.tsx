export default function GovernmentSection() {
  return (
    <section id="government">
      <div className="container">
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="section-label">Our Government</span>
          <h2 className="section-title">A Nation Governed<br />by Its <em>People</em></h2>
          <div className="gold-rule" style={{ margin: '1.5rem auto' }}></div>
          <p style={{ color: 'var(--cn-tan)', maxWidth: '620px', margin: '0 auto', lineHeight: 1.7 }}>
            The Cherokee Nation operates under a constitutional government with three co-equal branches,
            adopted September 6, 1839 — one of the oldest tribal constitutions in the United States.
          </p>
        </div>

        <div className="government-grid reveal" style={{ transitionDelay: '.1s' }}>
          <div className="gov-branch-card">
            <div className="gov-branch-icon">⚖</div>
            <h3 className="gov-branch-title">Executive Branch</h3>
            <div className="gov-branch-rule"></div>
            <p className="gov-branch-desc">The Principal Chief serves as the head of government, with the Deputy Principal Chief providing leadership and oversight of executive operations and tribal programs.</p>
            <ul className="gov-branch-links">
              <li>Principal Chief</li>
              <li>Deputy Principal Chief</li>
              <li>Office of the Attorney General</li>
              <li>Office of Financial Resources</li>
            </ul>
          </div>

          <div className="gov-branch-card gov-branch-card--featured">
            <div className="gov-branch-icon">🏛</div>
            <h3 className="gov-branch-title">Legislative Branch</h3>
            <div className="gov-branch-rule"></div>
            <p className="gov-branch-desc">The Tribal Council is composed of 17 elected members serving four-year terms. The Council enacts legislation, approves the annual budget, and represents the citizens of the Cherokee Nation.</p>
            <ul className="gov-branch-links">
              <li>17-Member Tribal Council</li>
              <li>Election Commission</li>
              <li>Delegate to Congress</li>
              <li>Cherokee Vote</li>
            </ul>
          </div>

          <div className="gov-branch-card">
            <div className="gov-branch-icon">⚖️</div>
            <h3 className="gov-branch-title">Judicial Branch</h3>
            <div className="gov-branch-rule"></div>
            <p className="gov-branch-desc">The Judicial Appeals Tribunal serves as the supreme court of the Cherokee Nation, ensuring justice and the rule of law in accordance with the Cherokee Constitution.</p>
            <ul className="gov-branch-links">
              <li>Judicial Appeals Tribunal</li>
              <li>District Courts</li>
              <li>Institutional Review Board</li>
              <li>Tax Commission</li>
            </ul>
          </div>
        </div>

        <div className="reveal gov-constitution-bar" style={{ transitionDelay: '.2s' }}>
          <span>Cherokee Nation Constitution — Adopted September 6, 1839</span>
          <a href="https://www.cherokee.org/our-government/constitution" target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ padding: '.4rem 1.2rem', fontSize: '.8rem' }}>
            Read the Constitution →
          </a>
        </div>
      </div>
    </section>
  )
}
