-- Arch Consult — Editable pricing
-- Run in Supabase SQL Editor (New query) AFTER 005_admin.sql. Safe to re-run.

create table if not exists public.pricing_packages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price text not null,                 -- label shown on the card, e.g. "₦250,000"
  cadence text not null default 'one-time',
  description text not null default '',
  features jsonb not null default '[]'::jsonb,
  highlighted boolean not null default false,
  amount_ngn numeric check (amount_ngn is null or amount_ngn > 0),
                                       -- real charge in NGN; empty = no "Pay" button
  is_placeholder boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.pricing_packages enable row level security;

-- Anyone can read prices (they are public on the pricing page).
drop policy if exists "Anyone can read pricing" on public.pricing_packages;
create policy "Anyone can read pricing"
  on public.pricing_packages for select using (true);

-- Only admins can change them.
drop policy if exists "Admins can insert pricing" on public.pricing_packages;
create policy "Admins can insert pricing"
  on public.pricing_packages for insert with check (public.is_admin());

drop policy if exists "Admins can update pricing" on public.pricing_packages;
create policy "Admins can update pricing"
  on public.pricing_packages for update
  using (public.is_admin()) with check (public.is_admin());

-- Copy today's packages from lib/constants.ts (skips any that already exist).
insert into public.pricing_packages
  (slug, name, price, cadence, description, features, highlighted, amount_ngn, is_placeholder, sort_order)
values
 ('starter','Starter','Placeholder','one-time',
  'For early-stage businesses that need clarity before they build.',
  '["Business Health Check with human review","Positioning workshop (1 session)","Brand naming support","Summary strategy document"]'::jsonb,
  false, 100, true, 1),
 ('growth','Growth','Placeholder','one-time',
  'For businesses ready to scale with a real strategy behind them.',
  '["Everything in Starter","Full brand strategy & identity guidelines","Marketing strategy & channel plan","Follow-up advisory access"]'::jsonb,
  true, null, true, 2),
 ('strategic','Strategic','Placeholder','one-time',
  'For businesses needing comprehensive branding and strategy.',
  '["Everything in Growth","Digital strategy & experience planning","Business growth strategy","Extended advisory access"]'::jsonb,
  false, null, true, 3),
 ('custom-enterprise','Custom Enterprise','Custom','quoted',
  'Custom consultancy scoped to organizations with complex needs.',
  '["Multi-stakeholder strategy engagements","Entrepreneurial advisory retainer","Dedicated consultant and reporting cadence","Custom scope and timeline"]'::jsonb,
  false, null, false, 4)
on conflict (slug) do nothing;
