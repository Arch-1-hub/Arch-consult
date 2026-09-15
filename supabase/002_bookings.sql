-- Arch Consult — Booking system database schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)
-- in addition to schema.sql (run this one second).

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  consultation_type text not null,
  preferred_date date not null,
  preferred_time text not null,
  name text not null,
  email text not null,
  phone text,
  business_name text,
  goals text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- Anyone can submit a booking — this is a public consultation-request form,
-- not an authenticated-only feature. Guests can book without an account;
-- if they happen to be logged in, user_id gets set automatically below.
drop policy if exists "Anyone can create a booking" on public.bookings;
create policy "Anyone can create a booking"
  on public.bookings for insert
  with check (true);

-- Logged-in users can see their own bookings (used by the future client
-- dashboard stage). Guest bookings (user_id null) aren't visible to anyone
-- via this policy — only to admins later, via a service-role query.
drop policy if exists "Users can view own bookings" on public.bookings;
create policy "Users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_created_at_idx on public.bookings(created_at desc);
