const CLAN_COLORS = ['#8B1A1A','#C8960C','#4A5E3A','#2C5F7A','#7A3B6B','#8B5E1A','#1A4A3A']

export default function CCOUnitedSection() {
  return (
    <section id="cco-united">
      <div className="container">
        <div className="cco-spotlight reveal">
          <div className="cco-spotlight-inner">
            <span className="section-label" style={{ color: 'var(--cn-gold)' }}>Community &amp; Cultural Outreach</span>
            <h2 className="section-title" style={{ marginTop: '.75rem' }}>
              CCO United —<br /><em>One Platform. Fourteen Communities.</em>
            </h2>
            <div className="gold-rule" style={{ margin: '1.5rem 0' }}></div>
            <p style={{ color: 'var(--cn-tan)', lineHeight: 1.75, maxWidth: '640px', marginBottom: '1.5rem' }}>
              The Cherokee Nation&apos;s 14 Community &amp; Cultural Outreach organizations now share a single,
              intelligent digital workspace. CCO United unifies grant management, resource directories,
              volunteer coordination, event planning, and AI-powered tools — giving every CCO the reach
              and efficiency of an organization ten times its size.
            </p>
            <p style={{ color: 'rgba(212,184,150,0.7)', fontSize: '.9rem', lineHeight: 1.65, maxWidth: '580px', marginBottom: '2rem' }}>
              Built by and for the Cherokee Nation, CCO United is a living platform that grows with the
              needs of its communities — connected, collaborative, and culturally grounded.
            </p>
            <a
              href="https://cco-united.joshbarteaux.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Visit CCO United →
            </a>
          </div>
          <div className="cco-clan-bar">
            {CLAN_COLORS.map((c, i) => (
              <div key={i} className="cco-clan-dot" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
