export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div>
          <span className="footer-logo">CCO United</span>
          <p className="footer-tagline">One Platform. Fourteen Communities.<br />Stronger Together.</p>
          <p className="footer-legal">CCO United is an independent platform being developed by <a href="mailto:josh@joshbarteaux.com" className="footer-email" target="_blank" rel="noopener noreferrer">josh@joshbarteaux.com</a> to serve Cherokee Nation&apos;s Cultural &amp; Community Outreach organizations.</p>
        </div>
        <div className="footer-col">
          <h4>Navigate</h4>
          <a href="#about">About</a>
          <a href="#building">Platform</a>
          <a href="#get-involved">Get Involved</a>
        </div>
        <div className="footer-col">
          <h4>Connect</h4>
          <a href="#get-involved">Contact Us</a>
          <a href="#">Facebook</a>
          <a href="#">Instagram</a>
          <a href="#">YouTube</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 CCO United</p>
        <div className="seven-dots">
          <div className="clan-dot" style={{ background: 'var(--clan1)' }}></div>
          <div className="clan-dot" style={{ background: 'var(--clan2)' }}></div>
          <div className="clan-dot" style={{ background: 'var(--clan3)' }}></div>
          <div className="clan-dot" style={{ background: 'var(--clan4)' }}></div>
          <div className="clan-dot" style={{ background: 'var(--clan5)' }}></div>
          <div className="clan-dot" style={{ background: 'var(--clan6)' }}></div>
          <div className="clan-dot" style={{ background: 'var(--clan7)' }}></div>
        </div>
      </div>
    </footer>
  )
}
