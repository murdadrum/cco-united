"use client"
import { useState } from 'react'

export default function ContactForm() {
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  function showError(fieldId: string) {
    setErrors(prev => ({ ...prev, [fieldId]: true }))
    const el = document.getElementById(fieldId)
    if (el) { el.classList.add('error'); el.classList.remove('valid') }
  }

  function clearError(fieldId: string) {
    setErrors(prev => ({ ...prev, [fieldId]: false }))
    const el = document.getElementById(fieldId)
    if (el) { el.classList.remove('error'); el.classList.add('valid') }
  }

  async function submitForm() {
    const n = (document.getElementById('f-name') as HTMLInputElement)?.value.trim()
    const e = (document.getElementById('f-email') as HTMLInputElement)?.value.trim()
    const o = (document.getElementById('f-org') as HTMLInputElement)?.value.trim()
    const r = (document.getElementById('f-role') as HTMLInputElement)?.value.trim()
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
      <div className="form-title">Contact CCO United</div>
      <div id="form-fields" style={{ display: showSuccess ? 'none' : undefined }}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name <span style={{ color: '#D45C5C' }}>*</span></label>
            <input type="text" id="f-name" placeholder="Your name"
              onInput={() => clearError('f-name')} />
            <span className={`field-error${errors['f-name'] ? ' visible' : ''}`} id="err-name">Please enter your name</span>
          </div>
          <div className="form-group">
            <label>Email Address <span style={{ color: '#D45C5C' }}>*</span></label>
            <input type="email" id="f-email" placeholder="your@email.com"
              onInput={() => clearError('f-email')} />
            <span className={`field-error${errors['f-email'] ? ' visible' : ''}`} id="err-email">Please enter a valid email address</span>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Organization / Affiliation <span style={{ color: '#D45C5C' }}>*</span></label>
            <input type="text" id="f-org" placeholder="Your organization or community"
              onInput={() => clearError('f-org')} />
            <span className={`field-error${errors['f-org'] ? ' visible' : ''}`} id="err-org">Please enter your organization</span>
          </div>
          <div className="form-group">
            <label>Your Role</label>
            <input type="text" id="f-role" placeholder="e.g. Director, Volunteer" />
          </div>
        </div>
        <div className="form-group">
          <label>Area of Interest</label>
          <select id="f-interest">
            <option value="">Select one...</option>
            <option>Tribal Registration</option>
            <option>Services Inquiry</option>
            <option>Employment</option>
            <option>Media / Press</option>
            <option>Partner Organization</option>
            <option>General Inquiry</option>
          </select>
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea id="f-msg"
            placeholder="How can we help you, or how would you like to get involved?"></textarea>
        </div>
        <button className="btn-submit" onClick={submitForm} disabled={submitting}>
          {submitting ? 'Sending…' : 'Send Message'}
        </button>
        <p className="form-note">Messages are reviewed by the CCO United team. For urgent matters, please visit cherokee.org directly.</p>
      </div>
      <div className="form-success" id="form-success" style={{ display: showSuccess ? 'block' : 'none' }}>
        <div className="s-icon">✶</div>
        <h3>Thank you.</h3>
        <p>We&apos;ll be in touch soon.<br /><br /><span className="wado">Wado.</span></p>
      </div>
    </>
  )
}
