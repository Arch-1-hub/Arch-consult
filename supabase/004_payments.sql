-- Arch Consult — Payments schema
-- Run this in the Supabase SQL Editor, in addition to schema.sql,
-- 002_bookings.sql, and 003_reports.sql.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  tx_ref text unique not null,
  provider_reference text,
  item_type text not null check (item_type in ('package', 'consultation', 'service')),
  item_name text not null,
  amount numeric not null,
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending', 'successful', 'failed')),
  customer_email text not null,
  customer_name text,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

alter table public.payments enable row level security;

-- Deliberately no INSERT or UPDATE policy for the anon/authenticated
-- roles. Every write to this table happens server-side through the
-- Supabase service-role key (see lib/supabase/admin.ts), which bypasses
-- RLS entirely — that's intentional: payment status must only ever be
-- set by our own server after independently verifying with Paystack,
-- never by a request coming from the browser. The only thing RLS needs
-- to allow here is a user reading their own payment history.
drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_tx_ref_idx on public.payments(tx_ref);
