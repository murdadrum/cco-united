# CLAUDE.md — CCO United (ccou-web)

## Project overview

CCO United is the shared digital workspace for Cherokee Nation's ~106 Community & Cultural Outreach (CCO) organizations. This repo (`ccou-web`) is the public-facing Next.js site hosted at `cco-united.joshbarteaux.com`.

The platform is built in two layers:
- **Monday.com** — backend for event management, CCO registry, automations, and admin workflows (kcco-force.monday.com)
- **This Next.js site** — public-facing UI, API bridge to Monday, Alisdelisgi AI chat widget

---

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript + React 18
- **Email:** Resend (already integrated — `/app/api/contact/route.ts`)
- **AI:** Anthropic Claude via streaming API (already integrated — `/app/api/chat/route.ts`)
- **3D:** Three.js (hero canvas — seven-pointed star, seven clans)
- **Testing:** Playwright (`npm run test`, `npm run test:prod`)
- **Styling:** Global CSS (`/app/globals.css`) — no Tailwind, no CSS modules except `page.module.css`

---

## Environment variables

```
ANTHROPIC_API_KEY=        # Claude API — already in use
RESEND_API_KEY=           # Resend email — already in use
RESEND_FROM_EMAIL=        # Sender address
RESEND_TO_EMAIL=          # Admin recipient
MONDAY_API_KEY=           # Monday.com GraphQL API — needed for Iteration 3
```

---

## Monday.com data layer

### Key board IDs
| Board | ID |
|---|---|
| CN Master Events Calendar | `18415647485` |
| Master CCO Registry | `18415645308` |
| KCCO-Force Project Management | `18415716594` |

### Monday GraphQL endpoint
```
https://api.monday.com/v2
Authorization: Bearer ${process.env.MONDAY_API_KEY}
Content-Type: application/json
```

### Events board — key column IDs
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
| Attachments | `file_mm3wykwt` | File |
| Email Validation | `color_mm3x8y7h` | Status |

### Events board — group IDs
| Group | ID |
|---|---|
| Pending Review | `group_mm3wccdn` |
| Approved & Published | `group_mm3wn6pa` |
| Happening Soon (≤14 days) | `group_mm3wzkwn` |
| New CCO — Pending | `group_mm3xwwbq` |
| Completed | `group_mm3w807e` |
| Cancelled / Postponed | `group_mm3w8f8w` |

### Fetching approved public events (GraphQL query)
```graphql
query {
  boards(ids: [18415647485]) {
    groups(ids: ["group_mm3wn6pa"]) {
      items_page(limit: 50) {
        items {
          id
          name
          column_values(ids: [
            "dropdown_mm3wv6ax",
            "date_mm3wkeye",
            "location_mm3wrcrr",
            "dropdown_mm3w9yyc",
            "boolean_mm3wsfmn",
            "long_text_mm3wd4nk",
            "file_mm3wykwt"
          ]) {
            id
            text
            value
          }
        }
      }
    }
  }
}
```

---

## Iteration 3 — what to build

### I3-1 — Public events calendar

**File:** `/app/api/events/route.ts`
- Query Monday board `18415647485`, group `group_mm3wn6pa` (Approved & Published)
- Filter for `boolean_mm3wsfmn` (Open to Public?) = true
- Return clean JSON array of events
- Cache with `revalidate: 300` (5 minutes)
- Use `process.env.MONDAY_API_KEY`

**File:** `/app/events/page.tsx`
- Server component — fetch from `/api/events`
- Filterable by Event Type, CCO Organization, date range
- Mobile-first
- Match CCO United brand — Cinzel font, `--cn-crimson` (#8B1A1A), `--cn-gold` (#C8960C), `--cn-dark` (#1A0F0A), `--cn-cream` (#F5EDD8) — all defined in `globals.css`
- Include subscribe CTA

**File:** `/app/events/[id]/page.tsx`
- Dynamic route per event item ID
- Full event detail — description, date, location, CCO, attachments
- OG metadata for social sharing
- RSVP / Subscribe button

### I3-2 — Subscribe / Follow

**File:** `/app/api/subscribe/route.ts`
- Accept POST: `{ email, name?, sms? }`
- Store subscriber via Resend audience list OR create Monday item on a Subscribers board
- Send confirmation email via Resend (same pattern as `/api/contact`)
- Return `{ ok: true }`

### I3-3 — Nav + Alisdelisgi updates

**File:** `/components/Nav.tsx`
- Add `{ href: '/events', label: 'Events' }` to `NAV_ITEMS` array

**File:** `/app/api/chat/route.ts`
- Update `SYS` system prompt to include CN Events Calendar awareness
- Alis should be able to answer questions about upcoming events and direct users to `/events`

### I3-4 — SMS reminders (Phase 2, after core pages live)
- Twilio integration
- Opt-in at subscribe time
- Fire 3-day reminders before registered events

---

## Brand / design tokens

All CSS variables are in `/app/globals.css`:

```css
--cn-crimson: #8B1A1A;   /* primary brand red */
--cn-gold: #C8960C;       /* primary brand gold */
--cn-gold-light: #E8B84B;
--cn-tan: #D4B896;
--cn-earth: #6B4226;
--cn-dark: #1A0F0A;       /* background */
--cn-cream: #F5EDD8;      /* text on dark */
--cn-sage: #4A5E3A;
```

Fonts (loaded via Google Fonts in `globals.css`):
- `Cinzel` — headings, brand wordmark
- `Libre Baskerville` — italic taglines
- `Source Sans 3` — body text

---

## Existing API route patterns

### Streaming AI (reference for new routes)
```ts
// /app/api/chat/route.ts
export const runtime = 'edge'
export async function POST(req: NextRequest) { ... }
```

### Standard JSON POST
```ts
// /app/api/contact/route.ts
export async function POST(req: NextRequest) {
  const { name, email } = await req.json()
  // validate → call external API → return NextResponse.json({ ok: true })
}
```

---

## Testing

```bash
npm run dev          # local dev server
npm run test         # Playwright (local)
npm run test:prod    # Playwright against cco-united.joshbarteaux.com
npm run build        # production build check
```

---

## Monday.com forms (WorkForms)

| Form | URL |
|---|---|
| CCO Event Submission | https://wkf.ms/49ZBDfG |
| CCO Registration | https://wkf.ms/4dI5jQW |

---

## Key contacts / accounts

| Role | Email |
|---|---|
| CCOU Admin (Josh) | josh@joshbarteaux.com |
| Dev/QA guest | josh@remotelyamused.com |
| Keys CCO lead | keys.cherokee.community@gmail.com |

---

## Cherokee language notes

- **Ôsiyo** — hello / greeting
- **Wado** — thank you
- **Alisdelisgi** (ᎠᎵᏍᏓᎵᏍᎩ) — "one who helps" — the AI assistant name
- Pronunciation: Uh-lee-s-deh-lee-s-gee

---

## Project management

All iterations tracked on Monday.com board `18415716594` (KCCO-Force Project Management).

- Iteration 1 ✅ — Monday boards, WorkForms, automations, soft launch
- Iteration 2 ✅ — New CCO flow, email validation, email comms, UX polish
- Iteration 3 🔲 — This codebase — public events calendar, subscribe, Alis update
- Pre-launch — Bulk import of ~106 CCOs via CSV

Baseline snapshots after each iteration stored in Monday folder `20565961`.
