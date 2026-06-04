# CCO United — `ccou-web`

Public-facing Next.js site for CCO United, the shared digital workspace for Cherokee Nation's Community & Cultural Outreach (CCO) organizations.

**Live site:** `cco-united.joshbarteaux.com`  
**Monday backend:** `kcco-force.monday.com`

---

## Architecture overview

The platform runs in two layers:

| Layer | Technology | Purpose |
|---|---|---|
| Backend | Monday.com | Event management, CCO registry, subscriber lists, project tracking |
| Frontend | Next.js 14 (App Router) | Public-facing UI, API bridge to Monday, AI chat widget |

---

## Site sections & Monday connections

### Home (`/`)

Multi-section landing page:

- **Hero** — Brand intro, "See the Vision" CTA scrolls to About
- **About** — Mission and platform overview
- **Building** — 9-card feature grid (see platform modules below)
- **Government / Services / News** — Cherokee Nation context sections
- **Get Involved** — Contact form (see below)
- **Footer** — Nav links, social, Monday WorkForm links

### Contact form — Get Involved section

**Component:** `src/components/ContactForm.tsx`  
**API route:** `src/app/api/contact/route.ts`  
**Integration:** Resend

When a visitor fills out the contact form:
1. Fields (name, email, organization, role, interest, message) are POST'd to `/api/contact`
2. Resend sends an email to `RESEND_TO_EMAIL` (admin) with the submission detail and `reply-to` set to the visitor's email
3. Subject line: `CCO United — New founding member request: {name}`
4. Visitor sees an in-page success state ("Thank you. Wado.")

No Monday board write — contact submissions are email-only.

---

## Platform modules

Each card in the Building section links to an internal page. Each internal page is a placeholder with a heading, description, and a CTA (to be wired to a Monday WorkForm once URLs are confirmed — pending I4-5).

| Card | Route | Monday Board | Board ID |
|---|---|---|---|
| Housing — Welcome Home | `/housing` | Housing Assistance | (kcco-force Main workspace) |
| Nutrition — The Strawberry Dispatch | `/nutrition` | Food Distribution / Members | `18415376711` / `18415376653` |
| Resources — Shared Resource Directory | `/resources` | Resource Library | (kcco-force Main workspace) |
| AI Agent — Alisdelisgi | opens chat widget | — | — |
| Grants — Grant Management Pipeline | `/grants` | Grant Pipeline | (kcco-force Main workspace) |
| People — Volunteer & Donor Tools | `/people` | Volunteers & Donors | (kcco-force Main workspace) |
| Events — Event Planning | `/events/submit` | CN Master Events Calendar | `18415647485` |
| Learning — Certifications & LMS | `/learning` | Learning & Development | (kcco-force Main workspace) |
| Emergency — Disaster Readiness | `/emergency` | Emergency Readiness | (kcco-force Main workspace) |

---

## Events system

### Public events calendar (`/events`)

**API route:** `src/app/api/events/route.ts`  
**Data source:** Monday board `18415647485` (CN Master Events Calendar)  
**Integration:** Monday GraphQL API

Flow:
1. GET `/api/events` queries Monday board `18415647485`, group `group_mm3wn6pa` (Approved & Published)
2. Filters for `boolean_mm3wsfmn` (Open to Public?) = `true`
3. Returns a clean JSON array, cached for 5 minutes (`Cache-Control: s-maxage=300`)
4. `src/app/events/EventsClient.tsx` renders the filterable grid (by Event Type, CCO Organization)

### Event detail (`/events/[id]`)

Each event card links to `/events/{monday-item-id}`. The page re-fetches the single item from Monday by ID and renders full detail (description, date, organization, event type).

### Event submission

The Events card CTA links to `/events/submit`, which redirects to the Monday WorkForm:  
`https://wkf.ms/49ZBDfG` (CCO Event Submission)

When a CCO submits an event via that form:
1. Monday creates an item in the **Pending Review** group (`group_mm3wccdn`) on board `18415647485`
2. Monday automation notifies the admin
3. Admin reviews and moves the item to **Approved & Published** (`group_mm3wn6pa`)
4. Event appears on the public `/events` calendar within 5 minutes (next cache refresh)

---

## Subscribe / follow

**API route:** `src/app/api/subscribe/route.ts`  
**Integration:** Monday GraphQL API

When a visitor subscribes from the events page:
1. POST `/api/subscribe` with `{ email, name? }`
2. Creates a new item on the Monday Subscribers board (`MONDAY_SUBSCRIBERS_BOARD_ID` env var)
3. Stores email (`email_mm3y7jse`) and subscribe date (`date_mm3yf68t`)
4. Returns `{ ok: true }` — no confirmation email currently (Phase 2: add Resend confirmation)

---

## Alisdelisgi AI chat widget

**Component:** `src/components/AliWidget.tsx`  
**API route:** `src/app/api/chat/route.ts`  
**Integration:** Anthropic Claude API (streaming, edge runtime)  
**System prompt:** `src/lib/cherokeeSitePrompt.ts`

The chat widget ("Alis") streams responses from Claude Sonnet via the Anthropic API. It is aware of:
- Cherokee Nation history, government, and services
- CCO United platform and the 14 CCO organizations
- Upcoming events (directs users to `/events`)
- How to get involved / request workspace access

No Monday connection — purely Anthropic API. The AI Agent card in the Building section opens this widget on click.

---

## Stack

- **Framework:** Next.js 14 App Router + TypeScript + React 18
- **Styling:** Global CSS (`src/app/globals.css`) — no Tailwind, no CSS modules except `page.module.css`
- **Email:** Resend
- **AI:** Anthropic Claude (streaming)
- **3D:** Three.js (hero canvas — seven-pointed star / seven clans)
- **Backend data:** Monday.com GraphQL API
- **Testing:** Playwright

---

## Environment variables

```
ANTHROPIC_API_KEY=              # Claude API
RESEND_API_KEY=                 # Resend email
RESEND_FROM_EMAIL=              # Sender address (e.g. noreply@...)
RESEND_TO_EMAIL=                # Admin recipient for contact form emails
MONDAY_API_KEY=                 # Monday.com GraphQL API
MONDAY_SUBSCRIBERS_BOARD_ID=    # Monday board ID for subscriber list
```

---

## Local development

```bash
npm install
npm run dev          # dev server at localhost:3000
npm run build        # production build check
npm run test         # Playwright (local)
npm run test:prod    # Playwright against live site
```

---

## Monday board reference

| Board | ID |
|---|---|
| CN Master Events Calendar | `18415647485` |
| Master CCO Registry | `18415645308` |
| KCCO-Force Project Management | `18415716594` |
| Food Distribution | `18415376711` |
| Members (Food Distribution) | `18415376653` |

### Events board groups

| Group | ID | Meaning |
|---|---|---|
| Pending Review | `group_mm3wccdn` | Newly submitted, awaiting admin |
| Approved & Published | `group_mm3wn6pa` | Live on public calendar |
| Happening Soon (≤14 days) | `group_mm3wzkwn` | Automated — moved by Monday |
| Completed | `group_mm3w807e` | Past events |
| Cancelled / Postponed | `group_mm3w8f8w` | Removed from public view |

---

## Monday WorkForms

| Form | URL |
|---|---|
| CCO Event Submission | https://wkf.ms/49ZBDfG |
| CCO Registration | https://wkf.ms/4dI5jQW |

Remaining WorkForms (housing, resources, grants, people, learning, emergency, nutrition) are pending creation in the Monday UI (I4-5). Once `wkf.ms` URLs are confirmed, placeholder CTAs on each internal page get replaced with real form links.

---

## Iteration history

| Iteration | Status | Scope |
|---|---|---|
| I1 | ✅ Complete | Monday boards, WorkForms, automations, soft launch |
| I2 | ✅ Complete | New CCO flow, email validation, email comms, UX polish |
| I3 | ✅ Complete | Public events calendar, subscribe API, Alis update |
| I4 | ✅ Complete | 9-card platform grid, internal feature pages, Nutrition card |
| I4-5 | 🔲 Pending | Wire Monday WorkForm URLs into internal pages |

All iterations tracked on Monday board `18415716594` (KCCO-Force Project Management).
