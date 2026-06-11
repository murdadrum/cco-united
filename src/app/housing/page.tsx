'use client'

import { useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

/* eslint-disable @next/next/no-img-element */

const STATS = [
  { num: '106+', label: 'CCO Organizations' },
  { num: '14',   label: 'Counties Served' },
  { num: '6',    label: 'Program Areas' },
  { num: '1794', label: 'Cherokee Nation Est.' },
]

const PROGRAMS = [
  {
    tag: 'Emergency',
    title: 'Emergency Shelter',
    desc: 'Immediate placement coordination for families facing displacement, eviction, or crisis situations.',
    img: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80',
    alt: 'Emergency response team coordinating community relief',
    value: 'Emergency Shelter',
  },
  {
    tag: 'Rental',
    title: 'Rental Assistance',
    desc: 'Deposits, past-due rent, and short-term gap support to prevent eviction and stabilize housing.',
    img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    alt: 'Keys representing rental and housing assistance',
    value: 'Rental Assistance',
  },
  {
    tag: 'Utilities',
    title: 'Utility Relief',
    desc: 'Electricity, water, and heating assistance coordinated through Cherokee Nation partner programs.',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    alt: 'Community support and resource coordination',
    value: 'Utility Relief',
  },
  {
    tag: 'Ownership',
    title: 'Homeownership Paths',
    desc: 'USDA Section 184 loan support, down-payment assistance, and financial literacy coaching.',
    img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
    alt: 'Welcoming home representing homeownership and community',
    value: 'Homeownership Paths',
  },
  {
    tag: 'Elder',
    title: 'Elder Housing',
    desc: 'Senior-specific stability programs, accessibility modifications, and in-home support referrals.',
    img: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80',
    alt: 'Community members supporting one another',
    value: 'Elder Housing',
  },
  {
    tag: 'Development',
    title: 'New Construction',
    desc: 'Cherokee Nation housing development pipeline — affordable units for tribal citizens in all 14 counties.',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    alt: 'New home construction representing housing development',
    value: 'New Construction',
  },
]

const STEPS = [
  { n: '1', label: 'Submit Inquiry',       detail: 'Complete the short form below with your contact info and program area.' },
  { n: '2', label: 'Coordinator Match',    detail: 'A CCO housing coordinator reviews your inquiry and identifies the right programs.' },
  { n: '3', label: 'Resource Connection',  detail: 'You receive a direct follow-up with next steps, program contacts, and application guidance.' },
]

// ── Resource Directory ────────────────────────────────────────────────────────

const RESOURCES = [
  {
    category: 'Emergency',
    title: 'Cherokee Nation Emergency Shelter Network',
    description: 'Crisis placement coordination for displaced families. Available 24/7 through the CN housing hotline.',
    contact: '(918) 453-5000',
    url: 'https://www.cherokee.org/all-services/housing/',
    tags: ['Emergency Shelter', 'Crisis'],
  },
  {
    category: 'Rental',
    title: 'Rental Assistance Program',
    description: 'Past-due rent, deposits, and eviction prevention. Applications processed within 5 business days.',
    contact: '(918) 453-5371',
    url: 'https://www.cherokee.org/all-services/housing/',
    tags: ['Rental Assistance'],
  },
  {
    category: 'Utilities',
    title: 'LIHEAP / Utility Assistance',
    description: 'Low Income Home Energy Assistance Program — electricity, gas, and water relief through Cherokee Nation partners.',
    contact: '(918) 453-5109',
    url: 'https://www.cherokee.org/all-services/housing/',
    tags: ['Utility Relief'],
  },
  {
    category: 'Ownership',
    title: 'Section 184 Home Loan Program',
    description: 'HUD-backed mortgage program for Native American tribal citizens. Low down payment, no PMI. Available statewide.',
    contact: '(918) 453-5040',
    url: 'https://www.cherokee.org/all-services/housing/',
    tags: ['Homeownership Paths'],
  },
  {
    category: 'Elder',
    title: 'Elder Housing Stability Program',
    description: 'Senior-specific housing support — accessibility modifications, in-home services, and senior living referrals for Cherokee citizens 55+.',
    contact: '(918) 453-5672',
    url: 'https://www.cherokee.org/all-services/housing/',
    tags: ['Elder Housing'],
  },
  {
    category: 'Development',
    title: 'CN Housing Authority — New Construction',
    description: "Cherokee Nation's affordable housing development pipeline. Applications open for units across all 14 service counties.",
    contact: '(918) 453-5040',
    url: 'https://www.cherokee.org/all-services/housing/',
    tags: ['New Construction'],
  },
]

// ── District Liaisons (seeded from Salesforce Account import) ────────────────

const LIAISONS = [
  { district: 'Tahlequah',    org: 'Tahlequah District CCO Council',         contact: 'James Adair',         email: 'tahlequah.cco@cherokee.org',           phone: '(918) 555-0202' },
  { district: 'Stilwell',     org: 'Stilwell Cherokee Heritage Society',      contact: 'Dorothy Swimmer',     email: 'stilwell.heritage@cherokee.org',        phone: '(918) 555-0303' },
  { district: 'Hulbert',      org: 'Hulbert Community Outreach',              contact: 'Robert Walkingstick', email: 'hulbert.outreach@cherokee.org',         phone: '(918) 555-0404' },
  { district: 'Sallisaw',     org: 'Keys Cherokee Community Organization',    contact: 'Mary Sequoyah',       email: 'keys.cherokee.community@gmail.com',     phone: '(918) 555-0101' },
  { district: 'Braggs',       org: 'Braggs Eagle District CCO',               contact: 'Susan Bowlin',        email: 'braggs.eagle@cherokee.org',             phone: '(918) 555-0505' },
  { district: 'Park Hill',    org: 'Park Hill Cultural Circle',               contact: 'Thomas Proctor',      email: 'parkhill.cultural@cherokee.org',        phone: '(918) 555-0606' },
  { district: 'Gore',         org: 'Gore District CCO',                       contact: 'Linda Cornsilk',      email: 'gore.district@cherokee.org',            phone: '(918) 555-0707' },
  { district: 'Welling',      org: 'Welling Community Outreach',              contact: 'George Vann',         email: 'welling.outreach@cherokee.org',         phone: '(918) 555-0808' },
  { district: 'Cookson',      org: 'Cookson Hills Cherokee Alliance',         contact: 'Patricia Hummingbird',email: 'cookson.alliance@cherokee.org',         phone: '(918) 555-0909' },
  { district: 'Marble City',  org: 'Marble City Cherokee Cultural Center',    contact: 'David Runningwater',  email: 'marblecity.cultural@cherokee.org',      phone: '(918) 555-1010' },
]

const DISTRICT_OPTIONS = ['', ...LIAISONS.map(l => l.district)]

export default function HousingPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', program: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [caseRef, setCaseRef] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/housing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      setCaseRef(data.caseId ? data.caseId.slice(-6).toUpperCase() : '')
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred')
      setStatus('error')
    }
  }

  const filteredResources = resourceFilter
    ? RESOURCES.filter(r => r.tags.includes(resourceFilter))
    : RESOURCES

  const matchedLiaison = LIAISONS.find(l => l.district === selectedDistrict)

  return (
    <>
      <Nav />
      <main className="events-page">

        {/* ── Hero ── */}
        <div className="events-hero">
          <span className="section-label">Community &amp; Cultural Outreach</span>
          <h1 className="section-title">Welcome Home</h1>
          <div className="gold-rule" />
          <p style={{ color: 'var(--cn-cream)', opacity: 0.8, maxWidth: '580px', margin: '1rem auto 0', fontSize: '0.95rem', lineHeight: 1.7 }}>
            Cherokee Nation families deserve stable, safe housing. CCO United coordinates
            housing resources, assistance programs, and support services across all 106+
            Community &amp; Cultural Outreach organizations — connecting families to the
            help they need, where they live.
          </p>
        </div>

        <div className="container" style={{ maxWidth: '960px', padding: '3rem 1.5rem 5rem' }}>

          {/* ── Stats ── */}
          <div className="stat-grid" style={{ marginBottom: '3.5rem' }}>
            {STATS.map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Program areas heading ── */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="section-label">Housing Programs</span>
            <h2 className="section-title" style={{ fontSize: '1.5rem', marginTop: '0.4rem' }}>How We Can Help</h2>
            <div className="gold-rule" style={{ margin: '0.75rem auto' }} />
            <p style={{ color: 'var(--cn-cream)', opacity: 0.7, maxWidth: '520px', margin: '0 auto', fontSize: '0.9rem', lineHeight: 1.6 }}>
              From emergency shelter to homeownership, CCO housing coordinators match families
              with the right programs across Cherokee Nation&rsquo;s service territory.
            </p>
          </div>

          {/* ── Program cards ── */}
          <div className="feature-grid" style={{ marginBottom: '4rem' }}>
            {PROGRAMS.map((p, i) => (
              <a
                key={p.value}
                href="#inquire"
                className="feature-card-link"
                onClick={e => {
                  e.preventDefault()
                  setForm(f => ({ ...f, program: p.value }))
                  setResourceFilter(p.value)
                  document.getElementById('inquire')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                <div className="feature-card" style={{ transitionDelay: `${i * 0.08}s` }}>
                  <img className="feature-card-img loaded" src={p.img} alt={p.alt} loading="lazy" />
                  <div className="feature-card-scrim" />
                  <div className="feature-card-body">
                    <span className="feature-card-tag">{p.tag}</span>
                    <div className="feature-name">{p.title}</div>
                    <p className="feature-desc">{p.desc}</p>
                    <span className="feature-card-cta">Request Information →</span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* ── How it works ── */}
          <div style={{
            background: 'rgba(200,150,12,0.05)',
            border: '1px solid rgba(200,150,12,0.15)',
            borderRadius: '10px',
            padding: '2.5rem 2rem',
            marginBottom: '4rem',
            textAlign: 'center',
          }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--cn-gold)', fontSize: '1.1rem', marginBottom: '2rem', letterSpacing: '0.05em' }}>
              How It Works
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
              {STEPS.map(step => (
                <div key={step.n} style={{ flex: '1 1 200px', maxWidth: '260px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    border: '2px solid var(--cn-gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                    fontFamily: 'Cinzel, serif', fontSize: '1rem', color: 'var(--cn-gold)',
                  }}>
                    {step.n}
                  </div>
                  <div style={{ fontFamily: 'Cinzel, serif', color: 'var(--cn-cream)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    {step.label}
                  </div>
                  <div style={{ color: 'var(--cn-cream)', opacity: 0.65, fontSize: '0.85rem', lineHeight: 1.6 }}>
                    {step.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ RESOURCE DIRECTORY ══════════════════════════════════════════════ */}
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <span className="section-label">Resource Directory</span>
              <h2 className="section-title" style={{ fontSize: '1.4rem', marginTop: '0.4rem' }}>Available Programs</h2>
              <div className="gold-rule" style={{ margin: '0.75rem auto 1.25rem' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setResourceFilter('')}
                  className={resourceFilter === '' ? 'events-filter-btn events-filter-btn--active' : 'events-filter-btn'}
                >All Programs</button>
                {PROGRAMS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setResourceFilter(p.value)}
                    className={resourceFilter === p.value ? 'events-filter-btn events-filter-btn--active' : 'events-filter-btn'}
                  >{p.tag}</button>
                ))}
              </div>
            </div>

            <div className="housing-resource-grid">
              {filteredResources.map(r => (
                <div key={r.title} className="housing-resource-card">
                  <div className="housing-resource-category">{r.category}</div>
                  <div className="housing-resource-title">{r.title}</div>
                  <p className="housing-resource-desc">{r.description}</p>
                  <div className="housing-resource-footer">
                    <span className="housing-resource-phone">{r.contact}</span>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="housing-resource-link">
                      Learn More →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ DISTRICT LIAISON LOOKUP ════════════════════════════════════════ */}
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <span className="section-label">Find Your Coordinator</span>
              <h2 className="section-title" style={{ fontSize: '1.4rem', marginTop: '0.4rem' }}>District Liaison Lookup</h2>
              <div className="gold-rule" style={{ margin: '0.75rem auto 0.5rem' }} />
              <p style={{ color: 'var(--cn-cream)', opacity: 0.65, fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                Select your district to find the CCO housing liaison in your area.
              </p>
            </div>

            <div style={{ maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="housing-district-select"
              >
                {DISTRICT_OPTIONS.map(d => (
                  <option key={d} value={d}>{d || '— Select your district —'}</option>
                ))}
              </select>
            </div>

            {matchedLiaison ? (
              <div className="housing-liaison-card">
                <div className="housing-liaison-org">{matchedLiaison.org}</div>
                <div className="housing-liaison-name">{matchedLiaison.contact}</div>
                <div className="housing-liaison-district">District: {matchedLiaison.district}</div>
                <div className="housing-liaison-contact">
                  <a href={`mailto:${matchedLiaison.email}`} className="housing-liaison-email">{matchedLiaison.email}</a>
                  <span className="housing-liaison-phone">{matchedLiaison.phone}</span>
                </div>
                <button
                  className="btn-submit"
                  style={{ marginTop: '1.25rem', width: '100%' }}
                  onClick={() => {
                    setForm(f => ({ ...f, message: `I would like to connect with my district liaison: ${matchedLiaison.contact} at ${matchedLiaison.org}.` }))
                    document.getElementById('inquire')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  Contact This Coordinator →
                </button>
              </div>
            ) : selectedDistrict === '' ? null : (
              <p style={{ textAlign: 'center', color: 'var(--cn-tan)', fontSize: '0.88rem' }}>
                No liaison found for that district — please submit an inquiry below and we&rsquo;ll connect you.
              </p>
            )}
          </div>

          {/* ══ INQUIRY FORM ═══════════════════════════════════════════════════ */}
          <div id="inquire" style={{ maxWidth: '680px', margin: '0 auto', scrollMarginTop: '100px' }}>
            {status === 'success' ? (
              <div className="form-success" style={{ display: 'block' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</p>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                  Wado — Request Received
                </p>
                {caseRef && (
                  <p style={{ fontFamily: 'Cinzel, serif', color: 'var(--cn-gold)', fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                    Reference #{caseRef}
                  </p>
                )}
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  A CCO housing coordinator will follow up at the email address you provided within 2 business days.
                  A confirmation has been sent to your inbox.
                </p>
                <button
                  onClick={() => { setStatus('idle'); setCaseRef(''); setForm({ name: '', email: '', phone: '', program: '', message: '' }) }}
                  className="btn-submit"
                  style={{ marginTop: '1.5rem' }}
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form className="form-card" onSubmit={handleSubmit} noValidate>
                <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--cn-gold)', fontSize: '1.1rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                  Request More Information
                </h2>
                <p style={{ color: 'var(--cn-cream)', opacity: 0.6, fontSize: '0.85rem', textAlign: 'center', marginBottom: '2rem', lineHeight: 1.5 }}>
                  Tell us a little about what you&rsquo;re looking for — a coordinator will reach out with next steps.
                </p>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="hi-name">Full Name *</label>
                    <input id="hi-name" type="text" value={form.name} onChange={set('name')} required placeholder="Your full name" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="hi-email">Email Address *</label>
                    <input id="hi-email" type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="hi-phone">Phone Number</label>
                    <input id="hi-phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="(optional)" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="hi-program">Program Area of Interest *</label>
                    <select id="hi-program" value={form.program} onChange={set('program')} required>
                      <option value="">— Select a program —</option>
                      {PROGRAMS.map(p => (
                        <option key={p.value} value={p.value}>{p.title}</option>
                      ))}
                      <option value="Not Sure">Not Sure / General Inquiry</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="hi-message">Message (optional)</label>
                  <textarea
                    id="hi-message"
                    value={form.message}
                    onChange={set('message')}
                    rows={4}
                    placeholder="Anything you'd like the coordinator to know before they reach out."
                  />
                </div>

                {status === 'error' && (
                  <p style={{ color: '#D45C5C', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {errorMsg || 'Something went wrong. Please try again.'}
                  </p>
                )}

                <button type="submit" className="btn-submit" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Sending…' : 'Send Inquiry'}
                </button>

                <p style={{ color: 'var(--cn-cream)', opacity: 0.4, fontSize: '0.78rem', textAlign: 'center', marginTop: '1.25rem', lineHeight: 1.5 }}>
                  Your information is shared only with CCO housing coordinators. Wado for trusting CCO United.
                </p>
              </form>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
