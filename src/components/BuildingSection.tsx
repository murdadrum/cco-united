/* eslint-disable @next/next/no-img-element */
"use client"
import React, { useCallback, useEffect } from 'react'

export default function BuildingSection() {
  useEffect(() => {
    document.querySelectorAll<HTMLImageElement>('.feature-card-img').forEach(img => {
      if (img.complete) {
        img.classList.add('loaded')
      } else {
        img.addEventListener('load', () => img.classList.add('loaded'), { once: true })
      }
    })
  }, [])

  const toggleAudio = useCallback(() => {
    const audio = document.getElementById('ali-audio') as HTMLAudioElement | null
    const btn = document.getElementById('ali-play-btn')
    if (!audio || !btn) return
    if (audio.paused) {
      audio.play()
      btn.classList.add('playing')
      audio.onended = () => btn.classList.remove('playing')
    } else {
      audio.pause()
      audio.currentTime = 0
      btn.classList.remove('playing')
    }
  }, [])

  const copySyllabary = useCallback((btn: HTMLButtonElement) => {
    navigator.clipboard.writeText('ᎠᎵᏍᏓᎵᏍᎩ').then(() => {
      btn.classList.add('copied')
      const tip = document.getElementById('copy-tip')
      if (tip) { tip.classList.add('show'); setTimeout(() => tip.classList.remove('show'), 1800) }
      setTimeout(() => btn.classList.remove('copied'), 1800)
    })
  }, [])

  return (
    <section id="building">
      <div className="container">
        <span className="section-label reveal">What We&apos;re Building</span>
        <h2 className="section-title reveal">One Platform<br /><em>Infinite Possibilities</em></h2>
        <div className="gold-rule reveal"></div>
        <p className="features-intro reveal">Every tool CCO groups need — in one place, configured to CCO United&apos;s
          mission, and powered by AI trained on our own data.</p>
        <div className="feature-grid">
          <a href="/housing"
            className="feature-card-link reveal">
            <div className="feature-card">
              <img className="feature-card-img" src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80"
                alt="Welcoming home representing housing assistance and community support" loading="lazy" />
              <div className="feature-card-scrim"></div>
              <div className="feature-card-body">
                <span className="feature-card-tag">Housing</span>
                <div className="feature-name">Welcome Home</div>
                <p className="feature-desc">Connect families with housing resources, assistance programs, and support
                  services — coordinated across Cherokee Nation CCO organizations.</p>
                <span className="feature-card-cta">View in Platform →</span>
              </div>
            </div>
          </a>
          <a href="/events/submit"
            className="feature-card-link reveal">
            <div className="feature-card" style={{ transitionDelay: '.08s' }}>
              <img className="feature-card-img" src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80"
                alt="Community gathering and celebration event" loading="lazy" />
              <div className="feature-card-scrim"></div>
              <div className="feature-card-body">
                <span className="feature-card-tag">Events</span>
                <div className="feature-name">Event Planning</div>
                <p className="feature-desc">Coordinate events across organizations with shared calendars, planning boards, and
                  communication tools.</p>
                <span className="feature-card-cta">View in Platform →</span>
              </div>
            </div>
          </a>
          <a href="/nutrition"
            className="feature-card-link reveal">
            <div className="feature-card" style={{ transitionDelay: '.16s' }}>
              <img className="feature-card-img" src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&q=80"
                alt="Fresh produce at a community farmer's market representing food distribution" loading="lazy" />
              <div className="feature-card-scrim"></div>
              <div className="feature-card-body">
                <span className="feature-card-tag">Nutrition</span>
                <div className="feature-name">The Strawberry Dispatch</div>
                <p className="feature-desc">Connecting Cherokee Nation community members with food distribution campaigns,
                  member enrollment, and nutritional support — coordinated by the Keys CCO.</p>
                <span className="feature-card-cta">View in Platform →</span>
              </div>
            </div>
          </a>
          <a href="/resources"
            className="feature-card-link reveal">
            <div className="feature-card" style={{ transitionDelay: '.24s' }}>
              <img className="feature-card-img" src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80"
                alt="Community members gathered around a table sharing resources" loading="lazy" />
              <div className="feature-card-scrim"></div>
              <div className="feature-card-body">
                <span className="feature-card-tag">Resources</span>
                <div className="feature-name">Shared Resource Directory</div>
                <p className="feature-desc">Centralized, searchable resource library across all 14 CCOs — healthcare, food,
                  housing, youth, elder services, and more.</p>
                <span className="feature-card-cta">View in Platform →</span>
              </div>
            </div>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); const w = document.getElementById('ali-widget'); const t = document.getElementById('ali-toggle'); if (w && w.style.maxHeight === '54px') t?.click(); w?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }}
            className="feature-card-link reveal">
            <div className="feature-card" style={{ transitionDelay: '.32s' }}>
              <img className="feature-card-img" src="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80"
                alt="Abstract AI technology visualization with glowing interface" loading="lazy" />
              <div className="feature-card-scrim"></div>
              <div className="feature-card-body">
                <span className="feature-card-tag">AI Agent</span>
                <div className="feature-name">Alisdelisgi AI Assistant</div>
                <p className="feature-desc">An intelligent agent trained on CCO United data — a knowledgeable community guide
                  configured to our mission, available 24/7.</p>
                <span className="feature-card-cta" style={{
                  background: '#E8B84B',
                  borderColor: '#E8B84B',
                  color: '#1A0F0A',
                }}>Ask a Question →</span>
              </div>
            </div>
          </a>
          <a href="/grants"
            className="feature-card-link reveal">
            <div className="feature-card" style={{ transitionDelay: '.40s' }}>
              <img className="feature-card-img" src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80"
                alt="Professional reviewing grant documents at a desk" loading="lazy" />
              <div className="feature-card-scrim"></div>
              <div className="feature-card-body">
                <span className="feature-card-tag">Grants</span>
                <div className="feature-name">Grant Management Pipeline</div>
                <p className="feature-desc">Track, collaborate on, and win more grants together. Shared history, requirements,
                  and workflows across all member organizations.</p>
                <span className="feature-card-cta">View in Platform →</span>
              </div>
            </div>
          </a>
          <a href="/people"
            className="feature-card-link reveal">
            <div className="feature-card" style={{ transitionDelay: '.48s' }}>
              <img className="feature-card-img" src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80"
                alt="Volunteers working together in a community setting" loading="lazy" />
              <div className="feature-card-scrim"></div>
              <div className="feature-card-body">
                <span className="feature-card-tag">People</span>
                <div className="feature-name">Volunteer &amp; Donor Tools</div>
                <p className="feature-desc">Recruit, manage, and retain the people who power your mission — with CRM tools
                  built for nonprofit realities.</p>
                <span className="feature-card-cta">View in Platform →</span>
              </div>
            </div>
          </a>
          <a href="/learning"
            className="feature-card-link reveal">
            <div className="feature-card" style={{ transitionDelay: '.56s' }}>
              <img className="feature-card-img" src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
                alt="People engaged in professional learning and education" loading="lazy" />
              <div className="feature-card-scrim"></div>
              <div className="feature-card-body">
                <span className="feature-card-tag">Learning</span>
                <div className="feature-name">Certifications &amp; LMS</div>
                <p className="feature-desc">NonprofitReady integration for volunteer and staff development — grants,
                  fundraising, leadership, and board essentials.</p>
                <span className="feature-card-cta">View in Platform →</span>
              </div>
            </div>
          </a>
          <a href="/emergency"
            className="feature-card-link reveal">
            <div className="feature-card" style={{ transitionDelay: '.64s' }}>
              <img className="feature-card-img" src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80"
                alt="Emergency response team coordinating disaster relief efforts" loading="lazy" />
              <div className="feature-card-scrim"></div>
              <div className="feature-card-body">
                <span className="feature-card-tag">Emergency</span>
                <div className="feature-name">Disaster Readiness</div>
                <p className="feature-desc">Centralized directory for emergency contacts, personnel, volunteers, resources,
                  policies, and protocols across Cherokee Nation.</p>
                <span className="feature-card-cta">View in Platform →</span>
              </div>
            </div>
          </a>
        </div>

        <blockquote className="platform-quote reveal">&ldquo;When our systems work together, our communities thrive together.&rdquo;
        </blockquote>

        {/* Alisdelisgi Spotlight */}
        <div className="ali-spotlight reveal">
          <div>
            <div className="ali-name">Alisdelisgi</div>
            <div className="ali-triad">
              <div className="ali-phonetic-row">
                Uh-lee-s-deh-lee-s-gee
                <button className="btn-play" id="ali-play-btn" aria-label="Hear pronunciation" onClick={toggleAudio}>
                  <svg className="icon-play" viewBox="0 0 12 12">
                    <polygon points="2,1 11,6 2,11" />
                  </svg>
                  <svg className="icon-pause" viewBox="0 0 12 12">
                    <rect x="1.5" y="1" width="3" height="10" />
                    <rect x="7.5" y="1" width="3" height="10" />
                  </svg>
                  Hear it
                </button>
              </div>
              <span className="copy-wrap">
                <span className="ali-syllabary">ᎠᎵᏍᏓᎵᏍᎩ</span>
                <button className="btn-copy" onClick={(e: React.MouseEvent<HTMLButtonElement>) => copySyllabary(e.currentTarget)} aria-label="Copy Cherokee syllabary"
                  title="Copy to clipboard">⎘</button>
                <span className="copy-tooltip" id="copy-tip">Copied!</span>
              </span>
              <br />&ldquo;One who helps&rdquo;
            </div>
            <audio id="ali-audio" preload="auto" src="/ali-pronunciation.mp3"></audio>
            <a href="#get-involved" className="btn-outline">Request Workspace Access →</a>
          </div>
          <div className="ali-desc">
            <p>Meet <strong className="ali-nick-highlight">Alis</strong> — CCO United&apos;s AI assistant, trained on our data and
              grounded in our mission.</p>
            <p>In the Cherokee tradition, a helper shows up — <strong>knowledgeable, present, and ready.</strong>{" "}
              Alisdelisgi embodies that. Available 24/7, it answers questions about resources, grants, events, and how to
              get involved — speaking with the warmth of a trusted community guide, not the cold efficiency of a generic
              chatbot.</p>
            <p>Ask <strong>Alis</strong> anything. It&apos;s listening now — lower right.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
