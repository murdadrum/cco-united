"use client"
import { useState } from 'react'

export default function ContactForm() {
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  function showError(fieldId: string) {
    setErrors(prev => ({ ...prev, [fieldId]: true }))
    const el = document.getElementById(fieldId)
    if (el) {
      el.classList.add('error')
      el.classList.remove('valid')
    }
  }

  function clearError(fieldId: string) {
    setErrors(prev => ({ ...prev, [fieldId]: false }))
    const el = document.getElementById(fieldId)
    if (el) {
      el.classList.remove('error')
      el.classList.add('valid')
    }
  }

  async function submitForm() {
    const n = (document.getElementById('f-name') as HTMLInputElement)?.value.trim()
    const e = (document.getElementById('f-email') as HTMLInputElement)?.value.trim()
    const o = (document.getElementById('f-org') as HTMLInputElement)?.value.trim()
    const r = (document.getElementById('f-role') as HTMLSelectElement)?.value
    const i = (document.getElementById('f-interest') as HTMLSelectElement)?.value
    const m = (document.getElementById('f-msg') as HTMLTextAreaElement)?.value.trim()
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    let valid = true
    if (!n) { showError('f-name'); valid = false }
    if (!e || !emailRe.test(e)) { showError('f-email'); valid = false }
    if (!o) { showError('f-org'); valid = false }
    if (!valid) {
      document.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n, email: e, org: o, role: r, interest: i, message: m }),
      })
      if (res.ok) {
        setShowSuccess(true)
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div id="form-fields" style={{ display: showSuccess ? 'none' : undefined }}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="f-name">Full Name *</label>
            <input id="f-name" type="text" placeholder="Your name"
              onChange={() => clearError('f-name')} />
            <span className={`field-error${errors['f-name'] ? ' visible' : ''}`} id="err-name">Please enter your name</span>
          </div>
          <div className="form-group">
            <label htmlFor="f-email">Email Address *</label>
            <input id="f-email" type="email" placeholder="your@email.com"
              onChange={() => clearError('f-email')} />
            <span className={`field-error${errors['f-email'] ? ' visible' : ''}`} id="err-email">Please enter a valid email address</span>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="f-org">Organization *</label>
            <input id="f-org" type="text" placeholder="Your CCO or organization"
              onChange={() => clearError('f-org')} />
            <span className={`field-error${errors['f-org'] ? ' visible' : ''}`} id="err-org">Please enter your organization</span>
          </div>
          <div className="form-group">
            <label htmlFor="f-role">Your Role</label>
            <select id="f-role">
              <option value="">Select your role</option>
              <option>CCO Director / Manager</option>
              <option>Board Member</option>
              <option>Volunteer Coordinator</option>
              <option>Grant Writer</option>
              <option>Cherokee Nation Staff</option>
              <option>Community Member</option>
              <option>Partner Organization</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="f-interest">Primary Area of Interest</label>
          <select id="f-interest">
            <option value="">What matters most to your organization?</option>
            <option>Grant Management &amp; Funding</option>
            <option>Resource Sharing &amp; Directory</option>
            <option>Volunteer &amp; Donor Management</option>
            <option>Event Planning &amp; Coordination</option>
            <option>Learning &amp; Certifications</option>
            <option>Emergency &amp; Disaster Response</option>
            <option>AI Tools &amp; Automation</option>
            <option>All of the above</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="f-msg">Tell Us About Your Organization</label>
          <textarea id="f-msg" rows={4}
            placeholder="What challenges is your CCO facing? What would make the biggest difference?"></textarea>
        </div>
        <button className="btn-submit" onClick={submitForm} disabled={submitting}>
          {submitting ? 'Sending…' : 'Become a Founding Member'}
        </button>
      </div>
      <div className="form-success" id="form-success" style={{ display: showSuccess ? 'block' : 'none' }}>
        <div className="s-icon">✓</div>
        <h3>You&apos;re on the list.</h3>
        <p>We&apos;ll be in touch soon.<br /><br /><span className="wado">Wado.</span></p>
      </div>
    </>
  )
}
