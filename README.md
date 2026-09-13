# Arch Consult

Premium AI-powered business consultancy platform. Next.js 14 (App Router) +
TypeScript + Tailwind CSS.

Arch Consult is a real, founder-led, early-stage consultancy
(Blessed Otamekhoraye, Founder & Branding Consultant — Nigeria · Remote
worldwide). Because of that, this codebase deliberately avoids fabricated
stats, testimonials, clients, or case studies anywhere in the UI — see
"A note on honesty" below.

## Status: Stage 5 — Auth & Database

Stage 1 delivered the foundation, Stage 2 the static content pages, Stage 3
the AI Business Consultant, Stage 4 the Health Check and Launch Wizard.
Stage 5 adds real user accounts backed by a real database, using Supabase
(Postgres + Auth in one service).

**This stage needs setup before it works** — unlike previous stages, there's
no free-tier shortcut that works with zero configuration. You'll need to
create a Supabase project (free tier) and run one SQL script. Full steps
below.

### A note on honesty (read this)

Arch Consult is early-stage. Per explicit instruction, this build never
fabricates:
- Client counts, ratings, or "businesses advised" style stats
- Testimonials — `lib/constants.ts` has an intentionally empty
  `testimonials` array; `components/home/Testimonials.tsx` renders an honest
  "coming soon" state until real ones are added
- Case studies or named clients — there is no case-studies section
- Certifications, awards, or credentials for the founder
- Final pricing — every price in `pricingPackages` is explicitly labeled
  "Placeholder" in the UI, not a real number

When adding real content later, only the following need editing:
`lib/constants.ts` (`testimonials`, `pricingPackages` prices, `founder` bio)
— no component logic needs to change.

**Important — read this before running anything:** this codebase was written
in an offline sandbox with no access to the npm registry, so the
dependencies listed in `package.json` have not actually been installed or
build-tested by the tool that wrote them. The code follows standard,
current Next.js/Tailwind/TypeScript conventions throughout, but you must run
the install and build yourself (see below) and report back any error output
so it can be fixed — don't assume it's flawless untested code.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real values as later stages need them
npm run dev
```

Visit `http://localhost:3000`.

```bash
npm run build   # production build
npm run typecheck
npm run lint
```

## What's implemented

- Design system: color tokens, typography (Fraunces display / IBM Plex Sans
  body), spacing and motion conventions — see `tailwind.config.ts` and
  `app/globals.css`.
- Real Arch Consult logo mark, extracted from your uploaded artwork with the
  background removed, in both light-surface and dark-surface variants
  (`public/logo-icon-dark.png`, `public/logo-icon-light.png`), plus a
  generated favicon/app icon set (`app/icon.png`, `app/apple-icon.png`).
- Global navigation (`components/layout/Navbar.tsx`) — responsive, with a
  working mobile menu (no library, plain React state).
- Global footer (`components/layout/Footer.tsx`).
- Full homepage (`app/page.tsx`) — hero, services overview, how it works,
  why Arch Consult, Business Health Check CTA, AI Consultant CTA,
  testimonials (honest empty state), founder section, insights preview,
  final CTA.
- **About** (`/about`) — mission, four-pillar approach, founder profile.
- **Services** (`/services` + `/services/[slug]`) — all 8 services with
  what-it-is / who-it's-for / problems-it-solves / deliverables, statically
  generated per service.
- **Pricing** (`/pricing`) — Starter / Growth / Strategic / Custom Enterprise,
  every price explicitly marked as a placeholder in the UI itself.
- **Contact** (`/contact`) — a real client-side form posting to a real
  server-side API route (`app/api/contact/route.ts`) with validation,
  sanitization, and basic in-memory rate limiting. If `RESEND_API_KEY` is
  set, it sends a real email via Resend; if not, it logs the submission
  server-side and tells the user honestly that email delivery isn't
  configured yet — it never fakes a "sent" confirmation.
- **Blog** (`/blog` + `/blog/[slug]`) — 6 full placeholder articles across
  the categories from the brief (Branding, Business Strategy, Marketing,
  Entrepreneurship, AI, African Business), statically generated per post.
- **AI Business Consultant** (`/ai-consultant`) — a structured intake form
  (industry, business stage, target customers, challenges, goals, current
  brand/marketing situation, budget/stage) posts to a real server-side API
  route (`app/api/ai-consultant/route.ts`) that calls OpenAI with a strict
  system prompt and returns a structured JSON assessment: business
  assessment, branding assessment, key problems, opportunities, recommended
  actions, suggested Arch Consult services (matched to real service pages),
  and next steps. Includes input validation, sanitization, and rate
  limiting (8 requests/hour per IP — AI calls cost real money). **If
  `OPENAI_API_KEY` isn't set, it does not fake a result** — it returns a
  clear message saying the AI Consultant isn't configured yet and points
  the visitor to book a human consultation instead.
- **Business Health Check** (`/health-check`) — a 10-step wizard: business
  stage, industry, target customer, revenue model, main challenges, growth
  goals (context), plus 7 scored questions covering Branding, Marketing,
  Positioning, Customer Acquisition, Digital Presence, Operations, and
  Growth Readiness. **Scores are computed client-side from the answers,
  deterministically** (`lib/health-check-data.ts`) — they're always real,
  even if the AI text generation step fails or isn't configured. AI
  (OpenAI/Groq) then generates a written summary, per-category insights,
  and recommendations from those scores plus context. Includes a
  print-to-PDF "Save as PDF" button (uses the browser's native print, no
  extra dependency) that hides nav/footer and switches to a light printable
  layout.
- **Business Launch Wizard** (`/launch-wizard`) — a 5-step wizard covering
  business idea, industry, location, target customers, problem/solution,
  product/service, pricing, competitors, goals, and resources. Generates a
  full structured launch plan: concept summary, target audience, value
  proposition, positioning, brand personality, brand naming suggestions,
  revenue model, marketing strategy, customer acquisition strategy, launch
  roadmap, SWOT analysis, and a 30/60/90-day action plan — plus matched
  Arch Consult services. Also has "Save as PDF".
- Shared wizard infrastructure (`components/shared/WizardShell.tsx`,
  `WizardFields.tsx`) — reused by both features, keeps step/progress UI and
  form field styling consistent, and makes future multi-step features
  (e.g. onboarding) cheap to add.
- Base SEO: metadata, Open Graph tags, `sitemap.ts` (now includes every
  service and blog route), `robots.ts`.
- Accessibility floor: visible focus rings, `prefers-reduced-motion`
  respected, semantic landmarks, real form labels.

## Turning the AI Consultant on

It's fully built but needs one thing to produce real output. Two options:

**Free, for testing:** get a free API key (no credit card) at
console.groq.com/keys, then set `GROQ_API_KEY` instead of `OPENAI_API_KEY`.
The code supports both — Groq's API is OpenAI-compatible, so no code
changes are needed. Groq's free tier is rate-limited (30 requests/minute,
~14,400/day) but plenty for testing the feature end to end before paying
for anything.

**For production:** get an API key from platform.openai.com and set
`OPENAI_API_KEY` — it's preferred over Groq if both are set, and gives
generally stronger output quality.

Either way:
1. In Vercel: Project → Settings → Environment Variables → add the key →
   redeploy
2. Locally: put it in `.env.local`

Until one of these is set, the page still works — it just tells the
visitor honestly that the AI Consultant isn't configured yet instead of
pretending to give them a real assessment.

## Setting up accounts (Supabase) — required for this stage to work

1. Go to **supabase.com**, sign up (free), and create a new project. Pick
   any name/region; save the database password it generates somewhere safe.
2. Once the project is ready, go to **Project Settings → API**. You'll need
   two values from this page:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Go to the **SQL Editor** in the Supabase dashboard → **New query** →
   paste the entire contents of `supabase/schema.sql` from this project →
   **Run**. This creates the `profiles` table, sets up row-level security
   so users can only ever see their own data, and creates a trigger so a
   profile row is automatically created every time someone signs up.
4. Add the two environment variables from step 2:
   - Locally: put them in `.env.local`
   - On Vercel: Project → Settings → Environment Variables → add both →
     redeploy
5. That's it — registration, login, password reset, and the account page
   should all work end to end.

**To make your own account an admin later** (needed for the future admin
dashboard stage): sign up normally through the site, then in Supabase's
**Table Editor → profiles**, find your row and change `role` from `client`
to `admin` — or run the SQL comment at the bottom of `schema.sql` with your
user ID.

## What's new in this stage

- **Register** (`/register`) — real sign-up via Supabase Auth (email +
  password + name + optional business name). Supabase sends a confirmation
  email before the account is fully active (Supabase's default,
  configurable in their dashboard if you'd rather skip it).
- **Login** (`/login`) — real sign-in, redirects back to wherever the user
  was trying to go (e.g. if middleware redirected them from `/account`).
- **Password reset** (`/reset-password` → emailed link → `/update-password`)
  — full real flow via Supabase Auth. The reset request always returns the
  same message whether or not the email exists, so the site can't be used
  to check who has an account.
- **Account page** (`/account`) — protected route (middleware redirects to
  `/login` if not signed in); lets a user update their name and business
  name, backed by the real `profiles` table.
- **Navbar** now reflects real session state — shows "Log in" or
  "Account" + "Log out" depending on whether someone is actually signed in
  (fetched server-side in `app/layout.tsx`, not just a UI toggle).
- **`middleware.ts`** refreshes the Supabase session on every request and
  protects `/account` (and is where future protected routes like
  `/dashboard` and `/admin` get added — just extend `PROTECTED_PREFIXES`).
- **`profiles` table + RLS** (`supabase/schema.sql`) — the actual database
  schema, with row-level security so a user can never read or write
  another user's profile, even if they tried to manipulate a request
  directly. This is the foundation later stages (dashboard, admin) will
  build their own tables on top of.
- If Supabase isn't configured, every auth page and the account page shows
  an honest "not configured yet" message rather than crashing or faking
  success — same pattern as the AI features.

## What's intentionally not built yet

Every link to `/book-consultation` currently points to a route that doesn't
exist yet — that's expected at this stage, not a bug. `/login` is now real.
The rest will 404 until built in the next stages, in this order:

1. AI Tools suite (Brand Name Generator, SWOT, etc. as standalone tools)
2. Booking system
3. Client dashboard (projects, reports, bookings, payments, documents,
   messages) — including saving Health Check / Launch Wizard / AI
   Consultant reports to an account, now that auth + database exist
4. Admin dashboard (including making `pricingPackages` admin-editable
   instead of hard-coded, and using the `role` column already in `profiles`)
5. Flutterwave payment integration (server-side verified)
6. Final QA pass: full route check, mobile pass, error/loading/empty
   states, accessibility pass

## Environment variables

See `.env.example`. As of this stage, `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are required for accounts to work (see
setup steps above). `OPENAI_API_KEY` or `GROQ_API_KEY` are required for the
AI features. Everything else is still for later stages. Never commit
`.env.local`.

## Project structure

```
app/                  routes (App Router), layout, metadata, SEO
components/layout/    Navbar, Footer, Logo
components/home/      homepage sections
components/ui/        shared UI primitives (Button, …)
lib/                  constants/demo data, utilities
public/               logo assets
```
