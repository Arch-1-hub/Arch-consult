# Arch Consult

Premium AI-powered business consultancy platform. Next.js 14 (App Router) +
TypeScript + Tailwind CSS.

## Status: Stage 1 — Foundation

This stage delivers the production-grade foundation: project scaffold, design
system, global navigation/footer, and the full homepage. It is built so every
later stage (AI Consultant, Business Health Check, Launch Wizard, client
dashboard, admin dashboard, booking, Flutterwave payments) plugs in without
reworking this layer.

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
  testimonials, case studies, insights preview, final CTA.
- Base SEO: metadata, Open Graph tags, `sitemap.ts`, `robots.ts`.
- Accessibility floor: visible focus rings, `prefers-reduced-motion`
  respected, semantic landmarks.

All copy, testimonials, case studies and blog previews in
`lib/constants.ts` are placeholder content clearly isolated in one file so
it's easy to replace with real client data later.

## What's intentionally not built yet

Every link in the navigation to `/services`, `/ai-consultant`,
`/health-check`, `/launch-wizard`, `/pricing`, `/blog`, `/book-consultation`,
`/login`, `/about`, `/contact` currently points to a route that doesn't
exist yet — that's expected at this stage, not a bug. They'll 404 until
built in the next stages, in this order:

1. Static pages: About, Services (+ detail pages), Pricing, Contact, Blog
2. Auth: register/login/reset, session handling
3. AI Consultant (OpenAI, server-side only)
4. Business Health Check + Business Launch Wizard
5. AI Tools suite
6. Booking system
7. Client dashboard (projects, reports, bookings, payments, documents,
   messages)
8. Admin dashboard
9. Flutterwave payment integration (server-side verified)
10. Database wiring (Postgres/Supabase) replacing in-file demo data
11. Transactional email
12. Final QA pass: full route check, mobile pass, error/loading/empty
    states, accessibility pass

## Environment variables

See `.env.example`. Nothing in this stage requires real secrets yet — the
file exists now so the shape of configuration is stable as later stages
start consuming it. Never commit `.env.local`.

## Project structure

```
app/                  routes (App Router), layout, metadata, SEO
components/layout/    Navbar, Footer, Logo
components/home/      homepage sections
components/ui/        shared UI primitives (Button, …)
lib/                  constants/demo data, utilities
public/               logo assets
```
