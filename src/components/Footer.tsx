export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div>
          <span className="footer-logo">Cherokee Nation</span>
          <p className="footer-tagline">Committed to protecting our inherent sovereignty,<br />preserving and promoting Cherokee culture.</p>
          <p className="footer-legal">This is a design prototype developed by <a href="mailto:josh@joshbarteaux.com" className="footer-email" target="_blank" rel="noopener noreferrer">josh@joshbarteaux.com</a>. For official Cherokee Nation information, visit <a href="https://www.cherokee.org" className="footer-email" target="_blank" rel="noopener noreferrer">cherokee.org</a>.</p>
        </div>
        <div className="footer-col">
          <h4>Navigate</h4>
          <a href="#about">About the Nation</a>
          <a href="#government">Government</a>
          <a href="#services">Services</a>
          <a href="#news">News</a>
          <a href="#get-involved">Get Involved</a>
        </div>
        <div className="footer-col">
          <h4>Connect</h4>
          <a href="#get-involved">Contact Us</a>
          <a href="https://cco-united.joshbarteaux.com" target="_blank" rel="noopener noreferrer">CCO United ↗</a>
          <a href="https://www.cherokeephoenix.org" target="_blank" rel="noopener noreferrer">Cherokee Phoenix ↗</a>
          <a href="https://www.osiyo.tv" target="_blank" rel="noopener noreferrer">OsiyoTV ↗</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Cherokee Nation · <a href="https://www.cherokee.org/privacy" target="_blank" rel="noopener noreferrer" className="footer-email">Privacy</a> · <a href="https://www.cherokee.org/accessibility" target="_blank" rel="noopener noreferrer" className="footer-email">Accessibility</a></p>
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
