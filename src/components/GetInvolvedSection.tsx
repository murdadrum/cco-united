import ContactForm from './ContactForm'

export default function GetInvolvedSection() {
  return (
    <section id="get-involved">
      <div className="section-inner">
        <span className="section-eyebrow reveal">Join the Movement</span>
        <h2 className="section-title reveal">Get <em>Involved</em></h2>
        <div className="involved-grid">
          <div className="involved-left reveal">
            <p>CCO United is being built with and for Cherokee Nation&apos;s CCO community. Whether you&apos;re a director, volunteer coordinator, grant writer, or community member — your voice shapes what this platform becomes.</p>
            <ul className="involved-list">
              <li><strong>CCO Directors &amp; Staff</strong> — Get early access and help configure your organization&apos;s workspace</li>
              <li><strong>Board Members</strong> — Review the platform roadmap and provide strategic guidance</li>
              <li><strong>Volunteers &amp; Community</strong> — Be among the first to use the new tools and provide feedback</li>
              <li><strong>Partners &amp; Funders</strong> — Explore sponsorship, grant alignment, and collaborative opportunities</li>
            </ul>
          </div>
          <div className="involved-right reveal" style={{transitionDelay: '.1s'}}>
            <div className="form-card">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
