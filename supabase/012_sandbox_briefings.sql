-- Arch Consult - Sandbox monthly briefings
-- Run in the Supabase SQL Editor, after 011_sandbox.sql.

alter table public.sandbox_simulations add column if not exists business_type text;

create table if not exists public.sandbox_briefings (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  niche text not null,
  state text not null default '',
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected', 'sent')),
  content jsonb not null,
  sources jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz,
  unique (month, niche, state)
);

create table if not exists public.sandbox_briefing_runs (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  feed_status jsonb not null,
  items_collected int not null default 0,
  news jsonb not null default '[]'::jsonb,
  briefings_drafted int not null default 0,
  briefings_failed int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.sandbox_briefings enable row level security;
alter table public.sandbox_briefing_runs enable row level security;
-- No policies on purpose: only the server (service-role key) reads or writes these tables,
-- after checking that the person is an admin.
