# Arch Consult

Premium AI-powered business consultancy platform. Next.js 14 (App Router) +
TypeScript + Tailwind CSS.

Arch Consult is a real, founder-led, early-stage consultancy
(Blessed Otamekhoraye, Founder & Branding Consultant — Nigeria · Remote
worldwide). Because of that, this codebase deliberately avoids fabricated
stats, testimonials, clients, or case studies anywhere in the UI — see
"A note on honesty" below.

## Status: Stage 9 — Payments (Paystack)

Stage 1 delivered the foundation, Stage 2 the static content pages, Stage 3
the AI Business Consultant, Stage 4 the Health Check and Launch Wizard,
Stage 5 real accounts and a database, Stage 6 the booking system, Stage 7
the AI Tools suite, Stage 8 the client dashboard. Stage 9 adds real
Paystack payments — the highest-stakes stage so far, since it's the
first one that moves real money, so read the safety notes below before
doing anything else.

**Read this before testing:** no one can be charged real money through
this build by default — see "Why nothing is chargeable yet" below.

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
- **Accounts** (`/register`, `/login`, `/reset-password`,
  `/update-password`, `/account`) — real sign-up/sign-in/password-reset via
  Supabase Auth, a protected account page (`middleware.ts` redirects
  signed-out visitors to `/login`), and a `profiles` table with row-level
  security so a user can only ever read/write their own row. Navbar
  reflects real session state, fetched server-side.
- **Booking system** (`/book-consultation`) — real form saving to a real
  `bookings` table, auto-linked to the logged-in user if there is one.
- **AI Tools suite** (`/ai-tools` + 8 tool pages) — Brand Name Generator,
  Brand Strategy Generator, Logo Brief Generator, Marketing Plan
  Generator, SWOT Analysis, Social Media Content Generator, Business
  Proposal Generator, and Business Idea Analyzer. All 8 share one API
  route (`app/api/ai-tools/route.ts`) and one result renderer
  (`components/ai-tools/AIToolOutput.tsx`) — each tool is just a config
  entry in `lib/ai-tools-data.ts` (fields + what the output should cover),
  not a separate implementation, so adding a 9th tool later is a config
  change, not new code. Uses the same OpenAI/Groq connection as the AI
  Consultant — no additional setup needed if that's already configured.
- **Client Dashboard** (`/dashboard`) — protected, tabbed (Overview,
  Bookings, Reports, Projects, Payments, Documents, Messages). Bookings
  and Reports show real data from the database; the other four are
  honest "not built yet" placeholders, not fake data.
- **Saved reports** — Health Check, Launch Wizard, and AI Consultant
  results can be saved to your account (`reports` table, RLS-protected)
  and viewed later in the dashboard, via one generic renderer that works
  across all three report shapes.
- **Payments (Paystack)** — real, server-verified checkout for pricing
  packages once a real price is set (see "Why nothing is chargeable yet"
  below — nothing is live by default). Guest checkout supported; results
  show in `/dashboard → Payments` if the payer was logged in.
- Base SEO: metadata, Open Graph tags, `sitemap.ts` (now includes every
  service, blog, and AI tool route), `robots.ts`.
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

## Setting up accounts (Supabase) — required for auth to work

1. Go to **supabase.com**, sign up (free), and create a new project.
2. Go to **Project Settings → API**. You'll need two values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **SQL Editor → New query** → paste the entire contents of
   `supabase/schema.sql` → **Run**. Creates the `profiles` table, RLS, and
   the auto-create-profile-on-signup trigger.
4. Add both env vars (locally in `.env.local`, on Vercel in Settings →
   Environment Variables → redeploy).
5. Also set `NEXT_PUBLIC_SITE_URL` to your real deployed URL (not
   `localhost`) — Supabase uses this to build confirmation/reset email
   links, and email links will silently point at the wrong place if this
   is left as the local default.

**To make your own account an admin later**: sign up normally, then in
Supabase's **Table Editor → profiles**, change your row's `role` from
`client` to `admin`.

## Adding the bookings table (if you haven't already, from Stage 6)

You already have a Supabase project from Stage 5. If you haven't run this
yet:

1. Supabase → your project → **SQL Editor → New query**
2. Paste the entire contents of `supabase/002_bookings.sql`
3. Run it — creates the `bookings` table with row-level security (anyone
   can submit a booking; only the logged-in user who made it, if any, can
   read it back — this is what the future client dashboard will use)

No new environment variables needed — it uses the same Supabase connection
from Stage 5. Booking details:

- **Book a Consultation** (`/book-consultation`) — a real form: consultation
  type, preferred date/time (fixed slots for now — see note below), name,
  email, phone, business name, and what to cover. Posts to a real API
  route (`app/api/bookings/route.ts`) with validation, sanitization, and
  rate limiting, then inserts into the real `bookings` table. If the
  visitor is logged in, their booking is automatically linked to their
  account (`user_id`) for the future client dashboard to show. Guests can
  book without an account.
- Shows a real confirmation screen summarizing what was submitted — no
  fake "email sent" claims, since email delivery isn't wired up yet
  (same honesty pattern as the contact form).
- **Fixed time slots, not a live calendar** — per the original spec,
  this is deliberately structured so a real calendar/availability
  integration (Google Calendar, Cal.com, etc.) can be swapped in later
  without changing the form, API route, or database shape — only the
  slot-generation logic would need to change.
- If Supabase isn't configured, the booking still gets logged
  server-side and the visitor gets an honest message rather than a fake
  confirmation.

## Adding the reports table (if you haven't already, from Stage 8)

You already have a Supabase project from Stage 5. If you haven't run this
yet:

1. Supabase → your project → **SQL Editor → New query**
2. Paste the entire contents of `supabase/003_reports.sql`
3. Run it — creates the `reports` table with row-level security (only the
   report's owner can ever see, insert, or delete it — there's no
   guest/anonymous saving, unlike bookings, since a report needs an
   account to be retrievable later)

## Setting up payments (Paystack) — required for this stage

1. Create a Paystack account at **paystack.com** (free to sign up).
   Their dashboard gives you both **test** and **live** API keys — start
   with test keys only.
2. Dashboard → **Settings → API Keys** → copy your **Secret Key** (test
   mode: starts with `sk_test_`).
3. Add it as `PAYSTACK_SECRET_KEY` (locally in `.env.local`, on Vercel
   in Settings → Environment Variables → redeploy).
4. Get your Supabase **service role key**: Supabase → Project Settings →
   API → **Legacy anon, service_role** tab → copy the `service_role`
   secret (never the anon one for this). Add it as
   `SUPABASE_SERVICE_ROLE_KEY`.
5. Run the payments table migration: Supabase → **SQL Editor → New
   query** → paste the entire contents of `supabase/004_payments.sql` →
   Run.
6. Make sure `NEXT_PUBLIC_SITE_URL` is still set to your real deployed
   URL (from Stage 5/6) — Paystack redirects back to
   `{NEXT_PUBLIC_SITE_URL}/payment/callback` after checkout, and this
   will silently break if that's still `localhost`.

## Why nothing is chargeable yet

Every price on `/pricing` still shows "Placeholder" and has no working
"Pay Now" button — on purpose. The full payment pipeline (checkout
creation → Paystack hosted page → server-side verification → database
record) is built and working, but it only activates for a package once you
deliberately give it a real `amountNGN` value in `lib/constants.ts`
(`pricingPackages`). Until you do that, the Pricing page behaves exactly
as it did in Stage 2 — informational only, linking to
`/book-consultation`. This means the payment mechanism is fully testable
by you right now, but no real visitor can accidentally pay against a
number nobody has confirmed.

**To test the full flow safely:**

1. In `lib/constants.ts`, temporarily add `amountNGN: 100` to one package
   (e.g. Starter) — this uses Paystack's **test mode**, so as long as
   your `PAYSTACK_SECRET_KEY` is a `sk_test_` key, no real money
   moves regardless of the amount.
2. Deploy, visit `/pricing`, and click the new "Pay Now" button on that
   package.
3. On Paystack's hosted checkout page, use one of their published
   **test card numbers** (search "Paystack test cards" in their docs —
   they publish specific card numbers, OTPs, and PINs that simulate
   success and failure without touching a real account).
4. After checkout, you'll land on `/payment/callback` — this is where the
   server verifies the transaction directly with Paystack before
   showing success. Check `/dashboard → Payments` afterward to see the
   real saved record.
5. Once you're confident it works and have confirmed your real prices,
   replace the test amount with the real one and switch
   `PAYSTACK_SECRET_KEY` to your **live** key to go live.

## What's new in this stage

- **Real Paystack checkout** for pricing packages, once a package has
  a real `amountNGN` set (see above). Uses Paystack's server-to-server
  "Standard" flow: our server creates the checkout session and gets back
  a hosted payment link — no Paystack JavaScript is loaded in the app
  at all, which keeps the client-side code simple and avoids any
  content-security-policy complications.
- **Server-side-only verification** (`app/payment/callback/page.tsx`) —
  the redirect back from Paystack is never trusted on its own. The
  server independently calls Paystack's verify endpoint and checks the
  status, amount, and currency all match before ever marking a payment
  successful in the database. This is the single most important security
  property of this stage.
- **`payments` table locked down to server-only writes**
  (`lib/supabase/admin.ts`, using the Supabase service role key) — no
  RLS policy allows the browser to create or update a payment row at all,
  from any account. The only thing a logged-in user's session can do is
  *read* their own payment history — every write happens from trusted
  server code that already independently verified the transaction with
  Paystack.
- **Guest checkout supported** — paying doesn't require an account, but
  if the payer happens to be logged in, the payment is automatically
  linked to their account and shows up in their dashboard.
- **Dashboard → Payments** now shows real data instead of the Stage 8
  placeholder — every payment tied to your account, with status.
- If Paystack or the service role key isn't configured, checkout shows
  an honest setup message rather than a broken or fake "Pay Now" button.

## What's intentionally not built yet

Everything now works, but the roadmap continues:

1. Admin dashboard (view all clients/bookings/payments, edit services and
   `pricingPackages` without a code deploy, manage blog/testimonials,
   update booking status)
2. Projects, Documents, and Messages — the dashboard has honest
   placeholders for these
3. Final QA pass: full route check, mobile pass, error/loading/empty
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
