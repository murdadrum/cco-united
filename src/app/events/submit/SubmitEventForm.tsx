'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const CCO_ORGS = [
  { id: 3, name: 'Keys Cherokee Community Organization Inc.' },
  { id: 0, name: 'TEST CCO — Dev & QA' },
  { id: 1, name: 'murda CCO' },
  { id: 2, name: '(Register a new CCO)' },
]

const EVENT_TYPES = [
  { id: 1, name: 'Groundbreaking' },
  { id: 2, name: 'Ribbon cutting' },
  { id: 3, name: 'Press conference' },
  { id: 4, name: 'Meeting' },
  { id: 5, name: 'Convention' },
]

type FieldErrors = Record<string, boolean>

type LocationSuggestion = { display_name: string; place_id: number }

export default function SubmitEventForm() {
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [locationValue, setLocationValue] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const titleRef = useRef<HTMLInputElement>(null)
  const ccoOrgRef = useRef<HTMLSelectElement>(null)
  const dateTimeRef = useRef<HTMLInputElement>(null)
  const eventTypeRef = useRef<HTMLSelectElement>(null)
  const [isPublic, setIsPublic] = useState(false)
  const submittedByRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  const fetchLocationSuggestions = useCallback((query: string) => {
    if (query.length < 3) { setLocationSuggestions([]); return }
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current)
    locationDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const results: LocationSuggestion[] = await res.json()
        setLocationSuggestions(results)
        setShowSuggestions(true)
      } catch { /* ignore */ }
    }, 350)
  }, [])

  useEffect(() => {
    return () => { if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current) }
  }, [])

  function validate(): boolean {
    const e: FieldErrors = {}
    if (!titleRef.current?.value.trim()) e.title = true
    if (!ccoOrgRef.current?.value) e.ccoOrg = true
    if (!dateTimeRef.current?.value) e.dateTime = true
    if (!locationValue.trim()) e.location = true
    if (!eventTypeRef.current?.value) e.eventType = true
    if (!submittedByRef.current?.value.trim()) e.submittedBy = true
    if (!emailRef.current?.value.trim()) e.email = true
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRef.current.value)) e.emailFormat = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setServerError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/events/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleRef.current!.value.trim(),
          ccoOrg: ccoOrgRef.current!.value,
          dateTime: dateTimeRef.current!.value,
          location: locationValue.trim(),
          eventType: eventTypeRef.current!.value,
          isPublic,
          submittedBy: submittedByRef.current!.value.trim(),
          email: emailRef.current!.value.trim(),
          description: descriptionRef.current!.value.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setServerError(data.error || 'Something went wrong. Please try again.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setServerError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="form-success" style={{ display: 'block' }}>
        <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</p>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
          Wado! Your event has been submitted for review.
        </p>
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          The CCOU Admin will review your submission and publish it to the network calendar.
        </p>
      </div>
    )
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>

      {/* Event Title — full width */}
      <div className="form-group">
        <label htmlFor="sf-title">Event Title *</label>
        <input id="sf-title" type="text" ref={titleRef} placeholder="Name of your event" />
        <span className={`field-error${errors.title ? ' visible' : ''}`}>Event title is required.</span>
      </div>

      {/* CCO Organization — full width */}
      <div className="form-group">
        <label htmlFor="sf-cco">CCO Organization *</label>
        <select id="sf-cco" ref={ccoOrgRef} defaultValue="">
          <option value="" disabled>Select your organization</option>
          {CCO_ORGS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <span className={`field-error${errors.ccoOrg ? ' visible' : ''}`}>Please select your organization.</span>
      </div>

      {/* Date & Time | Location — 2 col */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="sf-date">Event Date &amp; Time *</label>
          <input id="sf-date" type="datetime-local" ref={dateTimeRef} />
          <span className={`field-error${errors.dateTime ? ' visible' : ''}`}>Date and time are required.</span>
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label htmlFor="sf-location">Location *</label>
          <input
            id="sf-location"
            type="text"
            placeholder="Address or venue name"
            autoComplete="off"
            value={locationValue}
            onChange={e => { setLocationValue(e.target.value); fetchLocationSuggestions(e.target.value) }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
          />
          {showSuggestions && locationSuggestions.length > 0 && (
            <ul className="location-suggestions">
              {locationSuggestions.map(s => (
                <li key={s.place_id} onMouseDown={() => { setLocationValue(s.display_name); setShowSuggestions(false) }}>
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}
          <span className={`field-error${errors.location ? ' visible' : ''}`}>Location is required.</span>
        </div>
      </div>

      {/* Event Type | Open to Public — 2 col */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="sf-type">Event Type *</label>
          <select id="sf-type" ref={eventTypeRef} defaultValue="">
            <option value="" disabled>Select event type</option>
            {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <span className={`field-error${errors.eventType ? ' visible' : ''}`}>Please select an event type.</span>
        </div>
        <div className="form-group" style={{ paddingTop: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            role="checkbox"
            aria-checked={isPublic}
            onClick={() => setIsPublic(p => !p)}
            className={`custom-checkbox${isPublic ? ' custom-checkbox--checked' : ''}`}
            aria-label="Open to the public"
          />
          <label
            onClick={() => setIsPublic(p => !p)}
            style={{ marginBottom: 0, textTransform: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            Open to the public
          </label>
        </div>
      </div>

      {/* Your Name | Your Email — 2 col */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="sf-name">Your Name *</label>
          <input id="sf-name" type="text" ref={submittedByRef} placeholder="Full name" />
          <span className={`field-error${errors.submittedBy ? ' visible' : ''}`}>Your name is required.</span>
        </div>
        <div className="form-group">
          <label htmlFor="sf-email">Your Email *</label>
          <input id="sf-email" type="email" ref={emailRef} placeholder="you@example.com" />
          <span className={`field-error${errors.email ? ' visible' : ''}`}>Email is required.</span>
          <span className={`field-error${errors.emailFormat ? ' visible' : ''}`}>Please enter a valid email address.</span>
        </div>
      </div>

      {/* Event Description — full width */}
      <div className="form-group">
        <label htmlFor="sf-desc">Event Description</label>
        <textarea id="sf-desc" ref={descriptionRef} rows={4}
          placeholder="Describe the event, what to expect, who should attend…" />
      </div>

      {serverError && (
        <p style={{ color: '#D45C5C', fontSize: '0.85rem', marginBottom: '1rem' }}>{serverError}</p>
      )}

      <button type="submit" className="btn-submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Event'}
      </button>
    </form>
  )
}
