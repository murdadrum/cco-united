const NEWS = [
  {
    date: 'May 2026',
    tag: 'Education',
    title: 'New Head Start Facility Opening in Stilwell',
    excerpt: 'The Cherokee Nation breaks ground on a state-of-the-art Head Start facility serving over 120 children in Adair County, expanding early childhood education access.',
  },
  {
    date: 'Apr 2026',
    tag: 'Veterans',
    title: 'Cherokee Warrior Flight to Washington D.C.',
    excerpt: 'Thirty Cherokee veterans honored on a recognition flight to Washington D.C., visiting memorials and meeting with the Congressional Delegate to Congress.',
  },
  {
    date: 'Apr 2026',
    tag: 'Culture',
    title: '2026 Remember the Removal Bike Ride',
    excerpt: 'Registration is open for the annual Remember the Removal Bike Ride, retracing the Trail of Tears to honor the resilience of the Cherokee people.',
  },
  {
    date: 'Mar 2026',
    tag: 'Media',
    title: '"Siyo from the Rez" Podcast Launches',
    excerpt: 'OsiyoTV debuts a new podcast series featuring Cherokee citizens sharing stories of culture, identity, and life in the Nation today.',
  },
  {
    date: 'Mar 2026',
    tag: 'Infrastructure',
    title: 'Tahlequah Sidewalk Improvement Project',
    excerpt: 'The Cherokee Nation invests in pedestrian infrastructure across Tahlequah, improving safety and accessibility for residents and visitors.',
  },
  {
    date: 'Feb 2026',
    tag: 'Language',
    title: 'Cherokee Language App Reaches 50,000 Users',
    excerpt: 'The Cherokee Nation Language Department celebrates a milestone as its mobile learning app surpasses 50,000 active learners worldwide.',
  },
]

export default function NewsSection() {
  return (
    <section id="news">
      <div className="container">
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="section-label">What&apos;s Happening</span>
          <h2 className="section-title">Latest from<br />the <em>Nation</em></h2>
          <div className="gold-rule" style={{ margin: '1.5rem auto' }}></div>
        </div>

        <div className="news-grid">
          {NEWS.map((n, i) => (
            <article key={n.title} className="news-card reveal" style={{ transitionDelay: `${i * 0.07}s` }}>
              <div className="news-card-meta">
                <span className="news-tag">{n.tag}</span>
                <span className="news-date">{n.date}</span>
              </div>
              <h3 className="news-title">{n.title}</h3>
              <p className="news-excerpt">{n.excerpt}</p>
              <span className="news-read">Read More →</span>
            </article>
          ))}
        </div>

        <div className="reveal" style={{ textAlign: 'center', marginTop: '3rem', transitionDelay: '.3s' }}>
          <a href="https://www.cherokee.org/about-the-nation/news" target="_blank" rel="noopener noreferrer" className="btn-outline">
            All News →
          </a>
        </div>
      </div>
    </section>
  )
}
