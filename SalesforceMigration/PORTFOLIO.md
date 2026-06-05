# CCO United — Salesforce Migration Portfolio

**Josh Barteaux** · josh@joshbarteaux.com · [github.com/murdadrum/cco-united](https://github.com/murdadrum/cco-united)

---

## Problem

Cherokee Nation's ~106 Community & Cultural Outreach (CCO) organizations managed events, housing inquiries, and member data across spreadsheets and Monday.com boards with no CRM backbone, no automated workflows, and no public-facing self-service portal.

The goal: migrate the operational data layer to Salesforce while keeping the live Next.js site running, then demonstrate the full enterprise pattern — ETL, Service Cloud, Experience Cloud, outbound integrations, Flow automation, and CI/CD — as a portfolio artifact for enterprise Salesforce roles.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Monday.com (Source)                      │
│   CN Master Events Calendar · Master CCO Registry · PM Board   │
└────────────────────┬────────────────────────────────────────────┘
                     │  GraphQL API (Named Credential: Monday_API)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Apex Batch ETL Layer                          │
│  MondayEtl.cls · AccountEtl.cls · LeadEtl.cls                  │
│  MondayEtlScheduler.cls (scheduled, 5-min cadence)             │
│  Monday_Config__mdt (custom metadata — board/column IDs)        │
└────────┬──────────────────────────┬────────────────────────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐      ┌──────────────────────────┐
│  Event__c       │      │  Account (CCO Registry)  │
│  (10 fields)    │      │  Lead (Housing Inquiry)  │
│  Status__c      │      │  Case (Service Cloud)    │
│  Is_Public__c   │      └──────────┬───────────────┘
│  Submitter_     │                 │ Status → Closed
│  Email__c       │                 ▼
└────────┬────────┘      ┌──────────────────────────┐
         │               │  CaseTrigger.trigger      │
         │ Status →      │  LoanOriginationCallout   │
         │ Approved      │  (@future callout=true)   │
         ▼               │  → callout:Loan_Orig_Mock │
┌─────────────────┐      └──────────────────────────┘
│  Event Status   │
│  Notification   │
│  (Record-       │
│  Triggered Flow)│
│  → email to     │
│  Submitter_     │
│  Email__c       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Experience Cloud (Guest Portal)                    │
│  ccoEventList LWC — SOQL: Event__c WHERE Is_Public__c = true   │
│  housingInquiryForm LWC — creates Case via EventController     │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js Public Site                           │
│  /events — Monday API → public event cards                     │
│  /housing — REST → Salesforce Case creation (username+pw OAuth)│
│  /api/chat — Anthropic Claude (Alisdelisgi AI assistant)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Was Built

### P0 — Foundation
SFDX scaffold, two-lane GitHub Actions CI (Salesforce deploy + Playwright BDD), playwright-bdd wiring, Hello World proof-of-deploy.

### P1 — Event ETL
`Event__c` custom object (10 fields: date, location, type, status, public flag, submitter email, Monday item ID). `MondayEtl.cls` batch class queries Monday GraphQL API via Named Credential, upserts records by `Monday_Item_Id__c`. `MondayEtlScheduler.cls` runs on a 5-minute schedule.

### P2 — CCO Registry + Lead ETL
`AccountEtl.cls` — 6 custom Account fields synced from Monday CCO Registry board. `LeadEtl.cls` — uses `Monday_Config__mdt` custom metadata type to drive board/column IDs without hardcoding. `Lead.Monday_Item_Id__c` external ID field for upsert idempotency.

### P3 — Housing Service Cloud
`/api/housing/route.ts` — Next.js API route authenticates to Salesforce via username+password OAuth, creates a `Case` record (Origin=Web, Status=New). `/housing/page.tsx` — mobile-first form with program-area selector and success/error states.

### P4 — Experience Cloud + LWC
`EventController.cls` — `@AuraEnabled(cacheable=true)` SOQL query: approved public future events ordered by date. `ccoEventList` LWC — renders event cards with type, title, date, and org. `housingInquiryForm` LWC — inline Case creation from Experience Cloud guest context. FLS granted, guest sharing rules configured.

### P5b — Outbound Integration
`LoanOriginationCallout.cls` — `@future(callout=true)` method fires when Case Status transitions to Closed (maps to Approved in production picklist). Serializes Case payload to JSON, POSTs to `callout:Loan_Origination_Mock/api/applications`. `CaseTrigger.trigger` — `after update`, fires only on status transition (not on every update). 3 test methods: success (201), graceful 500 handling, trigger coverage.

### P5c — Flow Automation
`Event_Status_Notification` — Record-Triggered Flow on `Event__c` after update when `Status__c = 'Approved'`. Sends `emailSimple` action to `Submitter_Email__c`. `Housing_Inquiry_Intake` — 3-step Screen Flow: Personal Info → Household Details → Describe Need → creates Lead + Case → confirmation screen.

### P6 — BDD Playwright Parity
`housing_inquiry.feature` + `event_list.feature` — Gherkin scenarios for form presence and events page structure. Step definitions using `playwright-bdd` `createBdd()` pattern with semantic Playwright locators. Both wired into the `salesforce-bdd` CI lane.

---

## Key Technical Decisions

**Named Credential for Monday API** — keeps the API key out of Apex entirely. All ETL callouts use `callout:Monday_API` — no secrets in code or metadata.

**Custom Metadata for ETL config** — `Monday_Config__mdt` stores board and column IDs. Swapping to a different Monday board requires a metadata update, not a code deploy.

**`@future(callout=true)` for outbound** — Salesforce prohibits callouts from trigger context. The `@future` annotation moves execution to an async queue, satisfying the platform constraint while preserving the trigger-driven pattern Lennar uses for loan/title API notifications.

**`.forceignore` for org-configured metadata** — Named Credential and Connected App are created in org Setup and excluded from the deploy manifest. This prevents name collision errors on repeated CI deploys and matches standard enterprise practice (secrets and certs belong in org config, not source control).

**`gh secret set < file` for JWT PEM** — browser paste collapses PEM newlines. Setting the secret from a file via CLI preserves the exact RSA key format required by `sf org login jwt`.

---

## CI/CD

Two GitHub Actions lanes on every push to `salesforce/**`:

| Lane | What it does |
|---|---|
| **Validate & Apex Tests** | JWT auth → `sf project deploy start --test-level RunLocalTests` |
| **Playwright BDD** | `npx bddgen` → `playwright test --project=salesforce-bdd` |

Test coverage: 33 Apex test methods across 7 test classes. Trigger coverage enforced by SF (≥1%). All tests run against live orgfarm — no mocking of the database layer.

---

## Demo Script (5 minutes)

**0:00 — Architecture overview** (30s)
Show the Mermaid diagram above. "Monday.com is the operational backend. Salesforce is the CRM layer. The Next.js site is the public face. All three talk to each other."

**0:30 — ETL in action** (60s)
Open Developer Console in orgfarm. Run `MondayEtlScheduler` anonymous Apex. Show `Event__c` records appear. "This is the same batch pattern we'd use for Lennar's title or ERP sync — the Named Credential swaps out, the ETL class stays the same."

**1:30 — Experience Cloud LWC** (60s)
Open the CCO United Community Experience Cloud site. Show `ccoEventList` rendering event cards from live SOQL. Click into `housingInquiryForm`. "This is the buyer portal pattern — authenticated guest access, LWC components, Service Cloud Cases created inline."

**2:30 — Service Cloud Case + outbound callout** (60s)
In Salesforce, find a housing Case. Change Status to Closed. Open Debug Log. Show `LoanOriginationCallout` firing — POST to `httpbin.org` mock, response logged. "Lennar's loan origination flow: Case approved → notify external system → log confirmation. Same pattern, production endpoint swaps in via Named Credential."

**3:30 — Flow automation** (30s)
Show `Event_Status_Notification` flow in Flow Builder. "Record-triggered, fires on approval, sends email to submitter. The `Housing_Inquiry_Intake` Screen Flow is the guided intake — replaces a static web form with a branching, validating, multi-step experience."

**4:00 — CI/CD** (60s)
Open GitHub Actions. Show both green lanes. "Every push to `salesforce/**` runs a full deploy to orgfarm and executes 33 Apex tests. The Playwright BDD lane runs Gherkin scenarios against the live Next.js site. This is the quality gate I'd bring to a Lennar sprint."

---

## Stack

| Layer | Technology |
|---|---|
| CRM | Salesforce (Apex, SOQL, LWC, Flow, Experience Cloud) |
| ETL source | Monday.com GraphQL API |
| Public site | Next.js 14 (App Router) + TypeScript |
| AI assistant | Anthropic Claude (streaming) |
| Email | Resend |
| CI/CD | GitHub Actions (JWT auth, SFDX deploy, Playwright BDD) |
| Testing | Playwright + playwright-bdd, Apex unit tests |
| Project management | Jira (cco-united.atlassian.net) |
