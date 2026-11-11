-- Arch Consult - Sandbox briefings written for each client
-- Run in the Supabase SQL Editor, after 013_sandbox_email.sql.

alter table public.sandbox_simulations add column if not exists profile jsonb;

create table if not exists public.sandbox_client_briefings (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  sim_id uuid references public.sandbox_simulations(id) on delete set null,
  email text not null,
  title text not null default '',
  area text not null default '',
  state text not null default '',
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected', 'sent')),
  content jsonb not null,
  growth jsonb,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz,
  unique (month, user_id)
);

create index if not exists sandbox_client_briefings_month_status
  on public.sandbox_client_briefings (month, status);

alter table public.sandbox_client_briefings enable row level security;
