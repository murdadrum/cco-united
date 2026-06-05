const SERVICES = [
  {
    icon: '🏥',
    title: 'Health Services',
    desc: 'Comprehensive healthcare for Cherokee citizens including medical, dental, vision, behavioral health, and wellness programs.',
    href: 'https://www.cherokee.org/all-services/health',
  },
  {
    icon: '🎓',
    title: 'Education Programs',
    desc: 'Scholarship opportunities, Head Start programs, vocational training, and language preservation education for all ages.',
    href: 'https://www.cherokee.org/all-services/education',
  },
  {
    icon: '🏠',
    title: 'Housing Authority',
    desc: 'Affordable housing assistance, home repair programs, and homeownership support for Cherokee Nation citizens.',
    href: 'https://www.cherokee.org/all-services/housing',
  },
  {
    icon: '🗣',
    title: 'Language Programs',
    desc: 'Preserving the Cherokee language through immersion schools, adult classes, digital resources, and community events.',
    href: 'https://www.cherokee.org/all-services/language',
  },
  {
    icon: '💼',
    title: 'Career Services',
    desc: 'Job placement assistance, workforce development, resume support, and employment opportunities across the Nation.',
    href: 'https://www.cherokee.org/all-services/career-services',
  },
  {
    icon: '🎖',
    title: 'Veterans Affairs',
    desc: 'Dedicated support for Cherokee veterans including benefits navigation, events, and recognition programs.',
    href: 'https://www.cherokee.org/all-services/veterans-affairs',
  },
]

export default function ServicesSection() {
  return (
    <section id="services">
      <div className="container">
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="section-label">Services</span>
          <h2 className="section-title">Here for Every<br /><em>Cherokee Citizen</em></h2>
          <div className="gold-rule" style={{ margin: '1.5rem auto' }}></div>
          <p style={{ color: 'var(--cn-tan)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.7 }}>
            The Cherokee Nation provides a wide range of services to support the health, education, and
            prosperity of our citizens and communities.
          </p>
        </div>

        <div className="services-grid">
          {SERVICES.map((s, i) => (
            <a
              key={s.title}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="service-card reveal"
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              <div className="service-icon">{s.icon}</div>
              <h3 className="service-title">{s.title}</h3>
              <p className="service-desc">{s.desc}</p>
              <span className="service-link">Learn More →</span>
            </a>
          ))}
        </div>

        <div className="reveal" style={{ textAlign: 'center', marginTop: '3rem', transitionDelay: '.3s' }}>
          <a href="https://www.cherokee.org/all-services" target="_blank" rel="noopener noreferrer" className="btn-outline">
            View All Services →
          </a>
        </div>
      </div>
    </section>
  )
}
