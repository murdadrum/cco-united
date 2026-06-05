import ContactForm from './ContactForm'

export default function GetInvolvedSection() {
  return (
    <section id="get-involved">
      <div className="container">
        <div className="involved-grid">
          <div className="reveal">
            <span className="section-label">Get Involved</span>
            <h2 className="section-title">Connect with<br /><em>CCO United</em></h2>
            <div className="gold-rule"></div>
            <p className="body-text">Whether you are a CCO organization representative, a community member seeking services, a volunteer, or simply want to learn more — we welcome your message.</p>
            <div className="urgency-highlight">Our community is stronger when its people are connected.</div>
            <p className="body-text">Reach out to request workspace access, inquire about services, explore partnership opportunities, or connect with our team for any other questions.</p>
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
