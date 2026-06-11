# From Monday With Love — CCO United (ccou-web + Salesforce Port)

## Project overview

CCO United is the shared digital workspace for Cherokee Nation's ~106 Community & Cultural Outreach (CCO) organizations. This repo contains two parallel implementations:

- **Monday.com backend** — the original: public Next.js site at `cco-united.joshbarteaux.com`
- **Salesforce backend** — the port: Experience Cloud site demonstrating ETL migration across Sales / Service / Experience Cloud

The two sites run in parallel. They are NOT synchronized and do not share a single source of truth. The Salesforce instance is a project demonstrating the ETL process of porting a Monday.com Workspace to a Salesforce Dev Org.

---

## Architecture

| Layer | Monday (Original) | Salesforce (Port) |
|---|---|---|
| Data | Monday.com GraphQL API | Salesforce REST / SOQL |
| Events | Board `18415647485` | `Event__c` custom object |
| CCO Registry | Board `18415645308` | `Account` (standard) |
| Subscribers | Subscribers board | `Lead` (standard) |
| Contact / Housing | Email via Resend / placeholder | `Case` (Service Cloud) |
| Public UI | Next.js 14 App Router | Experience Cloud LWR site |
| AI Chat | Anthropic Claude streaming | Anthropic Claude (embedded) |
| PM | Monday board `18415716594` | Jira (external, Scrum) |
| CI/CD | GitHub Actions — Playwright | GitHub Actions — SF deploy + Apex + Playwright-BDD |

---

## Stack

- **Framework (Monday):** Next.js 14 (App Router) + TypeScript + React 18
- **Framework (Salesforce):** SFDX + Apex + LWC + Experience Cloud (LWR)
- **Email:** Resend (Monday side — `src/app/api/contact/route.ts`)
- **AI:** Anthropic Claude via streaming API (`src/app/api/chat/route.ts`)
- **3D:** Three.js (hero canvas — seven-pointed star, seven clans)
- **Testing (Monday):** Playwright (`npm run test`)
- **Testing (Salesforce):** Playwright-BDD + Apex tests (`npm run test:bdd`, `sf apex test run`)
- **Styling:** Global CSS (`src/app/globals.css`) — no Tailwind, no CSS modules except `page.module.css`
- **PM:** Jira (company-managed Scrum, 1-week sprints)
- **CI/CD:** GitHub Actions — three lanes across two workflows

---

## Repo layout

```
ccou-web/
├── src/                          # Next.js app (Monday backend)
│   ├── app/                      # App Router pages + API routes
│   │   ├── api/chat/             # Anthropic Claude streaming
│   │   ├── api/contact/          # Resend email
│   │   ├── api/events/           # Monday events read + submit
│   │   ├── api/subscribe/        # Monday subscriber write
│   │   ├── events/               # Events pages (list, detail, submit)
│   │   ├── housing/              # Placeholder feature pages
│   │   ├── grants/
│   │   ├── people/
│   │   ├── resources/
│   │   ├── emergency/
│   │   ├── learning/
│   │   ├── nutrition/
│   │   └── page.tsx              # Home (hero, about, building, get-involved)
│   ├── components/               # React components
│   └── lib/                      # Shared utils, Monday types, prompts
├── salesforce/                   # SFDX project (Salesforce backend)
│   ├── sfdx-project.json
│   ├── .forceignore
│   ├── config/
│   │   └── project-scratch-def.json
│   └── force-app/main/default/
│       ├── classes/              # Apex classes + test classes
│       ├── lwc/                  # Lightning Web Components (Phase 4)
│       ├── objects/              # Custom objects + fields (Phase 1)
│       ├── layouts/              # Page layouts
│       └── permissionsets/       # Permission sets
├── tests/
│   ├── smoke.spec.ts             # Monday baseline — page load, nav, stats
│   ├── events.spec.ts            # Monday — events page, view toggle, subscribe
│   ├── contact-form.spec.ts      # Monday — contact form validation + submit
│   ├── ali-chat.spec.ts          # Monday — Alis chat widget
│   ├── submit-event.spec.ts      # Monday — event submission form
│   └── bdd/
│       ├── features/salesforce/  # Gherkin .feature files (= test cases)
│       └── steps/salesforce/     # Playwright step definitions
├── .github/workflows/
│   ├── playwright.yml            # Lane: Monday-baseline Playwright (existing)
│   └── salesforce-ci.yml         # Lanes: SF deploy + Apex; Playwright-BDD
├── playwright.config.ts          # All projects: chromium, mobile, salesforce-bdd
├── package.json
├── CLAUDE.md                     # This file
└── README.md
```

---

## Environment variables

```
# Monday backend (existing)
ANTHROPIC_API_KEY=              # Claude API — already in use
RESEND_API_KEY=                 # Resend email — already in use
RESEND_FROM_EMAIL=              # Sender address
RESEND_TO_EMAIL=                # Admin recipient
MONDAY_API_KEY=                 # Monday.com GraphQL API
MONDAY_SUBSCRIBERS_BOARD_ID=    # Subscriber board ID
MONDAY_EVENTS_BOARD_ID=         # Events board: 18415647485
MONDAY_EVENTS_GROUP_ID=         # Approved group: group_mm3wn6pa

# Salesforce backend (new)
SF_LOGIN_URL=https://login.salesforce.com
SF_USERNAME=                    # Dev Edition org username
SF_CLIENT_ID=                   # Connected App consumer key (JWT CI auth)
# SF_JWT_KEY — GitHub Secret only, never in .env
# SF_BASE_URL — GitHub Variable, set once Experience Cloud site is live (Phase 4)
```

---

## Salesforce data model (MVP scope)

### Monday to Salesforce migration mapping

| Monday Board / Feature | Salesforce Object | Cloud | Phase |
|---|---|---|---|
| CN Master Events Calendar (`18415647485`) | `Event__c` (custom) | Platform | P1 |
| Master CCO Registry (`18415645308`) | `Account` (standard) | Sales | P1 |
| Event subscribers | `Lead` (standard) | Sales | P2 |
| Housing assistance requests (net-new) | `Case` (standard) | Service | P3 |
| Public events + member portal | Experience Cloud LWR site | Experience | P4 |
| Alis AI chat (embed) | External API integration | Integration | P4 |

### Event__c field mapping (Phase 1)

| Monday Column | Column ID | SF Field API Name | SF Type |
|---|---|---|---|
| Item name | — | `Name` | Text (auto) |
| CCO Organization | `dropdown_mm3wv6ax` | `CCO_Organization__c` | Lookup(Account) |
| Event Date & Time | `date_mm3wkeye` | `Event_Date__c` | DateTime |
| Location | `location_mm3wrcrr` | `Location__c` | Text(255) |
| Event Type | `dropdown_mm3w9yyc` | `Event_Type__c` | Picklist |
| Open to Public? | `boolean_mm3wsfmn` | `Is_Public__c` | Checkbox |
| Event Description | `long_text_mm3wd4nk` | `Description__c` | Long Text Area |
| Submitted By | `text_mm3w87h6` | `Submitted_By__c` | Text |
| Submitter Email | `email_mm3w2zs6` | `Submitter_Email__c` | Email |
| Monday Group | — | `Status__c` | Picklist |

Status__c values: Pending Review, Approved, Happening Soon, Completed, Cancelled

### Case field mapping (Phase 3 — Housing)

| Purpose | SF Field | Type | Notes |
|---|---|---|---|
| Subject | `Subject` | Text (standard) | "Housing Request: {name}" |
| Details | `Description` | Long Text (standard) | Request details |
| Contact Email | `SuppliedEmail` | Email (standard) | Web-to-Case |
| Contact Name | `SuppliedName` | Text (standard) | Web-to-Case |
| Request Type | `Type` | Picklist (standard) | Housing, General, Emergency |
| Priority | `Priority` | Picklist (standard) | High, Medium, Low |
| Status | `Status` | Picklist (standard) | New, Triaged, In Progress, Resolved, Closed |

---

## Monday.com data layer (reference)

### Key board IDs

| Board | ID |
|---|---|
| CN Master Events Calendar | `18415647485` |
| Master CCO Registry | `18415645308` |
| KCCO-Force Project Management | `18415716594` |
| Food Distribution | `18415376711` |
| Members (Food Distribution) | `18415376653` |

### Events board key column IDs

| Column | ID | Type |
|---|---|---|
| CCO Organization | `dropdown_mm3wv6ax` | Dropdown |
| Event Date & Time | `date_mm3wkeye` | Date |
| Location | `location_mm3wrcrr` | Location |
| Event Type | `dropdown_mm3w9yyc` | Dropdown |
| Open to Public? | `boolean_mm3wsfmn` | Checkbox |
| Submitted By | `text_mm3w87h6` | Text |
| Submitter Email | `email_mm3w2zs6` | Email |
| Event Description | `long_text_mm3wd4nk` | Long text |

### Events board group IDs and SF status mapping

| Group | ID | SF Status Mapping |
|---|---|---|
| Pending Review | `group_mm3wccdn` | Pending Review |
| Approved & Published | `group_mm3wn6pa` | Approved |
| Happening Soon | `group_mm3wzkwn` | Approved (derived) |
| Completed | `group_mm3w807e` | Completed |
| Cancelled / Postponed | `group_mm3w8f8w` | Cancelled |

### Monday GraphQL endpoint

```
POST https://api.monday.com/v2
Authorization: Bearer ${MONDAY_API_KEY}
Content-Type: application/json
```

### Fetching approved public events

```graphql
query {
  boards(ids: [18415647485]) {
    groups(ids: ["group_mm3wn6pa"]) {
      items_page(limit: 50) {
        items {
          id
          name
          column_values(ids: [
            "dropdown_mm3wv6ax", "date_mm3wkeye", "location_mm3wrcrr",
            "dropdown_mm3w9yyc", "boolean_mm3wsfmn", "long_text_mm3wd4nk"
          ]) { id text value }
        }
      }
    }
  }
}
```

---

## Salesforce CLI reference

```bash
# Auth — interactive (local dev)
sf org login web --alias ccouSF --set-default

# Auth — JWT (CI)
sf org login jwt \
  --client-id $SF_CLIENT_ID \
  --jwt-key-file server.key \
  --username $SF_USERNAME \
  --alias ccouSF --set-default

# Deploy + test (from /salesforce directory)
sf project deploy start \
  --source-dir force-app \
  --target-org ccouSF \
  --test-level RunLocalTests --wait 30

# Run a single Apex test
sf apex test run --class-names HelloWorldTest --result-format human --target-org ccouSF

# Full test run with coverage report
sf apex test run \
  --test-level RunLocalTests --code-coverage \
  --result-format json --output-dir test-results \
  --target-org ccouSF

# Query data (SOQL)
sf data query --query "SELECT Id, Name FROM Account LIMIT 10" --target-org ccouSF

# Open org in browser
sf org open --target-org ccouSF
```

---

## Existing API route patterns (Monday backend)

### Streaming AI

```ts
// src/app/api/chat/route.ts — edge runtime, SSE streaming
export const runtime = 'edge'
export async function POST(req: NextRequest) { ... }
```

### Standard JSON POST

```ts
// src/app/api/contact/route.ts — Resend email
export async function POST(req: NextRequest) {
  const { name, email } = await req.json()
  // validate → call Resend → return NextResponse.json({ ok: true })
}
```

---

## Testing

```bash
# Monday baseline (existing Playwright)
npm run test              # All projects (chromium + mobile-safari)
npm run test:monday       # Chromium project only
npm run test:prod         # Against cco-united.joshbarteaux.com
npm run test:ui           # Playwright UI mode

# Salesforce BDD
npm run bddgen            # Generate specs from .feature files
npm run test:bdd          # Generate + run salesforce-bdd project

# All tests
npm run test:all          # Generate BDD + run every project

# Salesforce Apex (from /salesforce)
sf apex test run --test-level RunLocalTests --code-coverage --target-org ccouSF
```

### Playwright projects

| Project | Target | Framework | Purpose |
|---|---|---|---|
| `chromium` | Next.js localhost or live | Playwright | Monday regression baseline |
| `mobile-safari` | Next.js localhost or live | Playwright | Mobile viewport tests |
| `salesforce-bdd` | Experience Cloud or localhost | Playwright-BDD | BDD parity + E2E |

### Test strategy (layered)

- **Playwright-BDD (Gherkin)** → customer-facing UI: Experience Cloud site + Next.js parity tests
- **Apex unit tests** → backend logic: triggers, flows, Apex classes — target 90%+ coverage
- **Playwright `request` fixture** → REST API validation: sObject API + Apex REST endpoints
- **SOQL / ETL harness** → migration data reconciliation: row counts + field-level diffs

### BDD as test-case management

Gherkin `.feature` files in `tests/bdd/features/` are the versioned, stakeholder-readable test-case repository. No separate TestRail — test cases live in Git alongside the code they validate.

---

## CI/CD — GitHub Actions

Three lanes across two workflows:

### playwright.yml (existing, unchanged)

- Triggers on PR / push to `main`
- Runs `chromium` project against Next.js localhost
- Uploads HTML report

### salesforce-ci.yml (new)

- **Job 1 — validate-and-test:** `sf project deploy start` (validation) + Apex tests via JWT
- **Job 2 — playwright-bdd:** generate BDD specs + run `salesforce-bdd` project
- Triggers on PR / push to `main` when `salesforce/**` or `tests/bdd/**` change

### GitHub Secrets (required for SF CI)

| Secret | Purpose |
|---|---|
| `SF_CLIENT_ID` | Connected App consumer key |
| `SF_JWT_KEY` | Server private key PEM (full file content) |
| `SF_USERNAME` | Dev Edition org username |

### GitHub Variables

| Variable | Purpose |
|---|---|
| `SF_EXPERIENCE_CLOUD_URL` | Experience Cloud live URL (set in Phase 4) |

---

## Brand / design tokens

CSS variables in `src/app/globals.css`:

```css
--cn-crimson: #8B1A1A;    /* primary brand red */
--cn-gold: #C8960C;        /* primary brand gold */
--cn-gold-light: #E8B84B;
--cn-tan: #D4B896;
--cn-earth: #6B4226;
--cn-dark: #1A0F0A;        /* background */
--cn-cream: #F5EDD8;       /* text on dark */
--cn-sage: #4A5E3A;
```

Fonts: `Cinzel` (headings), `Libre Baskerville` (taglines), `Source Sans 3` (body)

---

## Phase roadmap

| Phase | Scope | Status |
|---|---|---|
| P0 | Foundation: Dev Ed org, SF CLI, SFDX project, Jira, CI pipelines, hello-world green | 🔲 Active |
| P1 | Data model + ETL: Event__c, Account migration, reconciliation harness | 🔲 |
| P2 | Sales Cloud: Accounts (CCO Registry), Leads (subscribers), lead conversion | 🔲 |
| P3 | Service Cloud: Housing Cases, queues, assignment rules, light SLA | 🔲 |
| P4 | Experience Cloud: LWR site, events LWC, housing form, embedded Alis | 🔲 |
| P5 | QA Automation: parity suite, API tests, ETL reconciliation in CI, defect lifecycle, QA metrics | 🔲 |
| P6 | Portfolio: case-study README, architecture diagrams, demo recording, JD mapping | 🔲 |

---

## Monday.com WorkForms (reference)

| Form | URL |
|---|---|
| CCO Event Submission | https://wkf.ms/49ZBDfG |
| CCO Registration | https://wkf.ms/4dI5jQW |

---

## Cherokee language notes

- **Osiyo** — hello / greeting
- **Wado** — thank you
- **Alisdelisgi** (ᎠᎵᏍᏓᎵᏍᎩ) — "one who helps" — the AI assistant name
- Pronunciation: Uh-lee-s-deh-lee-s-gee

---

## Key contacts

| Role | Email |
|---|---|
| CCOU Admin / Dev (Josh) | josh@joshbarteaux.com |
| Dev/QA guest | josh@remotelyamused.com |
| Keys CCO lead | keys.cherokee.community@gmail.com |

---

## Project management

- **Tool:** Jira (company-managed Scrum, 1-week sprints)
- **Backlog:** imported from `ccou-sf-jira-backlog.csv`
- **Defect workflow:** Open → Triaged → In Progress → In Review → Ready for QA → Verified → Done (+ Reopened)
- **Custom fields:** Severity, Found In, Test Type
- **Components:** Foundation, CI/CD, Data Model, ETL, Sales Cloud, Service Cloud, Experience Cloud, Events, Housing, Alis, Test Automation
- **Versions:** Phase 0 through Phase 6

Previous Monday-tracked iterations (reference):
- Iteration 1 ✅ — Monday boards, WorkForms, automations, soft launch
- Iteration 2 ✅ — New CCO flow, email validation, email comms, UX polish
- Iteration 3 ✅ — Public events calendar, subscribe API, Alis update
- Iteration 4 ✅ — 9-card platform grid, internal feature pages, Nutrition card
