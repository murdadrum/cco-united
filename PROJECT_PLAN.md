# CCO United — Project Plan

**Site:** cco-united.joshbarteaux.com  
**Repo:** ccou-web (Next.js 14 + Salesforce + Monday.com)  
**Updated:** 2026-06-05

---

## Status Summary

| Phase | Description | Status |
|---|---|---|
| Salesforce Migration (P0–P7) | Full CRM layer, ETL, LWC, CI/CD, Portfolio | ✅ Complete |
| Iteration 3 — Front-End UI | Public events calendar, subscribe, nav, Alis update | 🔲 Up next |
| Iteration 3 — SMS Reminders | Twilio opt-in, 3-day event reminders | 🔲 Phase 2 |

---

## Completed — Salesforce Migration Sprint

### P0 — Foundation ✅
- SFDX project scaffold, API v62
- Two-lane GitHub Actions CI (Salesforce deploy + Playwright BDD)
- JWT auth via orgfarm Connected App (`ccounited-orgfarm`)
- Hello World proof-of-deploy, all green

### P1 — Event ETL ✅
- `Event__c` custom object — 10 fields (date, location, type, status, public flag, submitter email, Monday item ID)
- `MondayEtl.cls` batch class — queries Monday GraphQL API via Named Credential, upserts by `Monday_Item_Id__c`
- `MondayEtlScheduler.cls` — 5-minute cadence scheduler
- Named Credential `Monday_API` — API key stays out of Apex entirely

### P2 — Sales Cloud ✅
- `AccountEtl.cls` — CCO Registry board (18415645308) → Salesforce Accounts; 6 custom fields; upsert by `Monday_Board_Id__c`
- `LeadEtl.cls` — event subscribers → Leads; `Monday_Config__mdt` drives board/column IDs without hardcoding
- `Lead.Monday_Item_Id__c` external ID for upsert idempotency

### P3 — Service Cloud ✅
- `/api/housing/route.ts` — Next.js API route authenticates to Salesforce via username+password OAuth, creates Case (Origin=Web, Status=New)
- `/housing/page.tsx` — mobile-first form with program-area selector, success/error states
- Case queues and assignment rules configured

### P4 — Experience Cloud + LWC ✅
- `EventController.cls` — `@AuraEnabled(cacheable=true)` SOQL: approved public future events ordered by date
- `ccoEventList` LWC — event cards with type, title, date, org
- `housingInquiryForm` LWC — inline Case creation from Experience Cloud guest context
- FLS granted, guest sharing rules configured

### P5 — Postman + SOQL Library ✅
- `postman/CCOUnited_SF_Integration.postman_collection.json` — Event__c CRUD, Account/CCO Registry, Case/Housing
- `salesforce/soql/` — `upcoming_public_events.soql`, `cco_registry_active.soql`, `housing_cases_open.soql`

### P5b — Outbound Integration ✅
- `LoanOriginationCallout.cls` — `@future(callout=true)`, fires on Case Status → Closed, POSTs JSON to `callout:Loan_Origination_Mock/api/applications`
- `CaseTrigger.trigger` — `after update`, fires only on status transition
- 33 Apex test methods across 7 test classes

### P5c — Flow Automation ✅
- `Event_Status_Notification` — Record-Triggered Flow on `Event__c`; fires on `Status__c = 'Approved'`; sends email to `Submitter_Email__c`
- `Housing_Inquiry_Intake` — 3-step Screen Flow: Personal Info → Household Details → Describe Need → creates Lead + Case → confirmation

### P6 — BDD Playwright ✅
- `housing_inquiry.feature` + `event_list.feature` — Gherkin scenarios
- Step definitions using `playwright-bdd` `createBdd()` pattern
- Both wired into `salesforce-bdd` CI lane, green

### P7 — Portfolio ✅
- `SalesforceMigration/PORTFOLIO.md` — architecture diagram, phase narrative, key decisions, CI/CD table, 5-minute demo script

---

## Up Next — Iteration 3: Front-End UI

### I3-1 — Public Events Calendar 🔲

**API:** `/app/api/events/route.ts`
- Query Monday board `18415647485`, group `group_mm3wn6pa` (Approved & Published)
- Filter `boolean_mm3wsfmn` (Open to Public?) = true
- Return clean JSON array; cache with `revalidate: 300`

**List page:** `/app/events/page.tsx`
- Server component, fetch from `/api/events`
- Filterable by Event Type, CCO Organization, date range
- Mobile-first, CCO United brand tokens

**Detail page:** `/app/events/[id]/page.tsx`
- Full event detail — description, date, location, CCO, attachments
- OG metadata for social sharing
- RSVP / Subscribe CTA

---

### I3-2 — Subscribe / Follow 🔲

**API:** `/app/api/subscribe/route.ts`
- POST `{ email, name?, sms? }`
- Store subscriber via Resend audience list or Monday Subscribers board
- Send confirmation email via Resend
- Return `{ ok: true }`

---

### I3-3 — Nav + Alisdelisgi Updates 🔲

**Nav:** `/components/Nav.tsx`
- Add `{ href: '/events', label: 'Events' }` to `NAV_ITEMS`

**Alis:** `/app/api/chat/route.ts`
- Update system prompt with CN Events Calendar awareness
- Alis answers questions about upcoming events, directs users to `/events`

---

### I3-4 — SMS Reminders (Phase 2) 🔲
- Twilio integration
- Opt-in captured at subscribe time
- 3-day reminder fires before registered events
- Depends on I3-2 subscribe flow being live first

---

## Brand / Design Tokens

All defined in `/app/globals.css`:

| Token | Value | Use |
|---|---|---|
| `--cn-crimson` | `#8B1A1A` | Primary brand red |
| `--cn-gold` | `#C8960C` | Primary brand gold |
| `--cn-dark` | `#1A0F0A` | Background |
| `--cn-cream` | `#F5EDD8` | Text on dark |
| `--cn-sage` | `#4A5E3A` | Accent |

Fonts: `Cinzel` (headings), `Libre Baskerville` (italic taglines), `Source Sans 3` (body)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Public site | Next.js 14 (App Router) + TypeScript |
| CRM | Salesforce (Apex, SOQL, LWC, Flow, Experience Cloud) |
| ETL source | Monday.com GraphQL API |
| Email | Resend |
| AI assistant | Anthropic Claude (streaming) — Alisdelisgi |
| SMS (planned) | Twilio |
| CI/CD | GitHub Actions — Node 24, JWT auth, SFDX deploy, Playwright BDD |
| Testing | Playwright + playwright-bdd, Apex unit tests (33 methods) |
| Project management | Jira (cco-united.atlassian.net) · Monday.com (kcco-force) |

---

## Key Contacts

| Role | Email |
|---|---|
| CCOU Admin | josh@joshbarteaux.com |
| Dev/QA guest | josh@remotelyamused.com |
| Keys CCO lead | keys.cherokee.community@gmail.com |
