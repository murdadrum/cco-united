import ContactForm from './ContactForm'

export default function GetInvolvedSection() {
  return (
    <section id="get-involved">
      <div className="container">
        <div className="involved-grid">
          <div className="reveal">
            <span className="section-label">Join Us</span>
            <h2 className="section-title">The Window<br />to Act Is <em>Now</em></h2>
            <div className="gold-rule"></div>
            <p className="body-text">CCO United is in active development. Early members help shape the platform, influence its features, and establish the foundation every future CCO will build on.</p>
            <div className="urgency-highlight">Your participation today defines the Cherokee Nation of tomorrow.</div>
            <p className="body-text">Whether you represent a CCO, support Cherokee Nation&apos;s mission, or want to volunteer, donate, or partner — there&apos;s a place for you in CCO United.</p>
          </div>
          <div className="reveal" style={{ transitionDelay: '.15s' }}>
            <div className="form-card">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
