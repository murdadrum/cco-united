'use client'
import { useState } from 'react'

const SKILLS = [
  'Administration', 'Arts & Culture', 'Community Outreach', 'Education',
  'Elder Care', 'Event Planning', 'Food Services', 'Fundraising',
  'Healthcare', 'Language Preservation', 'Legal Aid', 'Media & Communications',
  'Mental Health', 'Social Services', 'Technology', 'Transportation',
  'Youth Programs',
]

export default function VolunteerForm() {
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

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

  function toggleSkill(skill: string) {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  async function submitForm() {
    const name = (document.getElementById('vf-name') as HTMLInputElement)?.value.trim()
    const email = (document.getElementById('vf-email') as HTMLInputElement)?.value.trim()
    const phone = (document.getElementById('vf-phone') as HTMLInputElement)?.value.trim()
    const location = (document.getElementById('vf-location') as HTMLInputElement)?.value.trim()
    const hours = (document.getElementById('vf-hours') as HTMLSelectElement)?.value
    const startDate = (document.getElementById('vf-start') as HTMLInputElement)?.value
    const message = (document.getElementById('vf-message') as HTMLTextAreaElement)?.value.trim()

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    let valid = true
    if (!name) { showError('vf-name'); valid = false }
    if (!email || !emailRe.test(email)) { showError('vf-email'); valid = false }
    if (!valid) {
      document.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, location, skills: selectedSkills, hours, startDate, message }),
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
      <div className="form-title">Register as a Volunteer</div>
      <div style={{ display: showSuccess ? 'none' : undefined }}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name <span style={{ color: '#D45C5C' }}>*</span></label>
            <input type="text" id="vf-name" placeholder="Your name"
              onInput={() => clearError('vf-name')} />
            <span className={`field-error${errors['vf-name'] ? ' visible' : ''}`}>Please enter your name</span>
          </div>
          <div className="form-group">
            <label>Email Address <span style={{ color: '#D45C5C' }}>*</span></label>
            <input type="email" id="vf-email" placeholder="your@email.com"
              onInput={() => clearError('vf-email')} />
            <span className={`field-error${errors['vf-email'] ? ' visible' : ''}`}>Please enter a valid email address</span>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" id="vf-phone" placeholder="(918) 555-0000" />
          </div>
          <div className="form-group">
            <label>City / Community</label>
            <input type="text" id="vf-location" placeholder="e.g. Tahlequah, OK" />
          </div>
        </div>
        <div className="form-group">
          <label>Skills &amp; Areas of Interest</label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(200,150,12,0.2)',
          }}>
            {SKILLS.map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.78rem',
                  letterSpacing: '0.06em',
                  fontFamily: "'Source Sans 3', sans-serif",
                  cursor: 'pointer',
                  border: selectedSkills.includes(skill)
                    ? '1px solid var(--cn-gold)'
                    : '1px solid rgba(200,150,12,0.3)',
                  background: selectedSkills.includes(skill)
                    ? 'rgba(200,150,12,0.15)'
                    : 'transparent',
                  color: selectedSkills.includes(skill)
                    ? 'var(--cn-gold)'
                    : 'var(--cn-tan)',
                  transition: 'all 0.2s',
                }}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Hours Available per Week</label>
            <select id="vf-hours">
              <option value="">Select...</option>
              <option value="1-3">1–3 hours</option>
              <option value="4-6">4–6 hours</option>
              <option value="7-9">7–9 hours</option>
              <option value="10+">10+ hours</option>
            </select>
          </div>
          <div className="form-group">
            <label>Available to Start</label>
            <input type="date" id="vf-start" style={{ colorScheme: 'dark' }} />
          </div>
        </div>
        <div className="form-group">
          <label>Tell Us About Yourself</label>
          <textarea id="vf-message"
            placeholder="Share your background, experience, or anything else you'd like us to know." />
        </div>
        <button className="btn-submit" onClick={submitForm} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Registration'}
        </button>
        <p className="form-note">Your registration is reviewed by the CCO United volunteer coordinator. We'll reach out within a few business days. Wado for your service.</p>
      </div>
      <div className="form-success" style={{ display: showSuccess ? 'block' : 'none' }}>
        <div className="s-icon">✶</div>
        <h3>Thank you.</h3>
        <p>Your volunteer registration has been received.<br /><br /><span className="wado">Wado.</span></p>
      </div>
    </>
  )
}
