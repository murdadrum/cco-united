# CCO United — Salesforce Portfolio

**Josh Barteaux** · josh@joshbarteaux.com · [github.com/murdadrum/ccou-salesforce](https://github.com/murdadrum/ccou-salesforce)

---

## Problem

Cherokee Nation's ~106 Community & Cultural Outreach (CCO) organizations needed a unified digital platform — events management, housing assistance intake, a public-facing community portal, and AI-assisted support — all backed by a CRM that could scale with the nation's programs.

The goal: build a Salesforce-native platform demonstrating the full enterprise pattern — Service Cloud, Experience Cloud, outbound integrations, Flow automation, and CI/CD — as both a working product and a portfolio artifact.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Salesforce (System of Record)                 │
│                                                                 │
│  Event__c (10 fields)     Account (CCO Registry)               │
│  Status__c · Is_Public__c Lead (Subscriber)                    │
│  Submitter_Email__c       Case (Housing Inquiry)               │
└────────┬──────────────────────────┬────────────────────────────┘
         │                          │
         │ Status → Approved        │ Status → Closed
         ▼                          ▼
┌─────────────────┐      ┌──────────────────────────┐
│  Event Status   │      │  CaseTrigger.trigger      │
│  Notification   │      │  LoanOriginationCallout   │
│  (Record-       │      │  (@future callout=true)   │
│  Triggered Flow)│      │  → callout:Loan_Orig_Mock │
│  → email to     │      └──────────────────────────┘
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
│  /events — SF SOQL → public event cards (sfAuth.ts)            │
│  /housing — SF REST → Case creation (username+pw OAuth)        │
│  /api/subscribe — SF REST → Lead creation                      │
│  /api/chat — Anthropic Claude (Alisdelisgi AI assistant)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Was Built

### Foundation
SFDX scaffold, two-lane GitHub Actions CI (Salesforce deploy + Playwright BDD), JWT auth via orgfarm Connected App, playwright-bdd wiring.

### Data Model — Event__c
Custom object with 10 fields: `Event_Date__c`, `Location__c`, `Event_Type__c`, `Status__c`, `Is_Public__c`, `Submitter_Email__c`, `CCO_Organization__c`, `Description__c`, `Submitted_By__c`. Guest sharing rules allow public read access via Experience Cloud.

### CCO Registry — Account
6 custom Account fields (`CCO_Status__c`, `CCO_Mission__c`, `CCO_Contact_Name__c`, `CCO_Contact_Email__c`, `CCO_Member_Since__c`). Accounts represent CCO organizations in the CRM.

### Service Cloud — Housing Cases
`/api/housing/route.ts` — Next.js API route authenticates to Salesforce via username+password OAuth (`sfAuth.ts`), creates a `Case` record (Origin=Web, Status=New, Type=Housing). Case queues and assignment rules configured.

### Experience Cloud + LWC
`EventController.cls` — `@AuraEnabled(cacheable=true)` SOQL: approved public future events ordered by date. `ccoEventList` LWC — event cards with type, title, date, org. `housingInquiryForm` LWC — inline Case creation from Experience Cloud guest context. FLS granted, guest sharing rules configured.

### Outbound Integration
`LoanOriginationCallout.cls` — `@future(callout=true)` fires when Case Status transitions to Closed. Serializes Case payload to JSON, POSTs to `callout:Loan_Origination_Mock/api/applications`. `CaseTrigger.trigger` — `after update`, fires only on status transition.

### Flow Automation
`Event_Status_Notification` — Record-Triggered Flow on `Event__c` after update when `Status__c = 'Approved'`. Sends `emailSimple` to `Submitter_Email__c`. `Housing_Inquiry_Intake` — 3-step Screen Flow: Personal Info → Household Details → Describe Need → creates Lead + Case → confirmation.

### Next.js Public Site (Salesforce-native)
`src/lib/sfAuth.ts` — shared OAuth token cache used by all SF-facing routes. `src/lib/fetchEvents.ts` — SOQL on `Event__c` (Is_Public__c=true, Status__c=Approved, Event_Date__c>=TODAY). `/api/subscribe` — creates Salesforce Lead. All data flows go directly to Salesforce — no intermediate layer.

### QA Automation
`housing_inquiry.feature` + `event_list.feature` — Gherkin scenarios. Step definitions using `playwright-bdd` `createBdd()` pattern. Both wired into `salesforce-bdd` CI lane.

---

## Key Technical Decisions

**`sfAuth.ts` shared token cache** — one OAuth token cached for 1 hour, shared across all Next.js API routes. Single point of auth, single point of invalidation on 401.

**`@future(callout=true)` for outbound** — Salesforce prohibits HTTP callouts from trigger context. The `@future` annotation moves execution to an async queue, satisfying the platform constraint while preserving the trigger-driven pattern.

**Named Credential for outbound mock** — `callout:Loan_Origination_Mock` keeps the endpoint URL out of Apex. Production endpoint swaps in via org config, zero code change.

**`.forceignore` for org-configured metadata** — Named Credential and Connected App excluded from the deploy manifest. Prevents collision errors on repeated CI deploys and matches standard enterprise practice.

**Guest sharing rules + FLS** — Experience Cloud guest users can read `Event__c` records (Is_Public__c=true) without authentication. FLS granted field-by-field to the guest profile.

---

## CI/CD

Two GitHub Actions lanes on every push to `salesforce/**`:

| Lane | What it does |
|---|---|
| **Validate & Apex Tests** | JWT auth → `sf project deploy start --test-level RunLocalTests` |
| **Playwright BDD** | `npx bddgen` → `playwright test --project=salesforce-bdd` |

Node.js 24. All Apex tests run against live orgfarm — no mocked database layer.

---

## Demo Script (5 minutes)

**0:00 — Architecture overview** (30s)
Show the diagram above. "Salesforce is the system of record. The Next.js site and Experience Cloud both query SF directly — no intermediate layer."

**0:30 — Service Cloud Case + outbound callout** (60s)
In Salesforce, find a housing Case. Change Status to Closed. Open Debug Log. Show `LoanOriginationCallout` firing — POST to httpbin.org mock, response logged. "Housing approved → notify loan origination system → log confirmation. Same pattern as Lennar's loan/title API flow — Named Credential swaps the endpoint in production."

**1:30 — Experience Cloud LWC** (60s)
Open the CCO United Community Experience Cloud site. Show `ccoEventList` rendering event cards from live SOQL. Click into `housingInquiryForm`. "Buyer portal pattern — authenticated guest access, LWC components, Service Cloud Cases created inline."

**2:30 — Flow automation** (30s)
Show `Event_Status_Notification` flow in Flow Builder. "Record-triggered, fires on approval, sends email to submitter. The `Housing_Inquiry_Intake` Screen Flow is the guided intake — replaces a static web form with a branching, validating, multi-step experience."

**3:00 — Next.js public site** (60s)
Open `cco-united.joshbarteaux.com/events`. Show live event cards pulled from `Event__c` via SF REST SOQL. Submit the subscribe form — Lead created in SF. "Public site talks directly to Salesforce. No Monday, no ETL, no sync lag."

**4:00 — CI/CD** (60s)
Open GitHub Actions. Show both green lanes. "Every push to `salesforce/**` runs a full deploy to orgfarm and executes Apex tests. The Playwright BDD lane runs Gherkin scenarios against the live Next.js site. This is the quality gate I'd bring to a Lennar sprint."

---

## Stack

| Layer | Technology |
|---|---|
| CRM | Salesforce (Apex, SOQL, LWC, Flow, Experience Cloud) |
| Public site | Next.js 14 (App Router) + TypeScript |
| AI assistant | Anthropic Claude (streaming) — Alisdelisgi |
| Email | Resend |
| CI/CD | GitHub Actions (Node 24, JWT auth, SFDX deploy, Playwright BDD) |
| Testing | Playwright + playwright-bdd, Apex unit tests |
| Project management | Jira (cco-united.atlassian.net) |
