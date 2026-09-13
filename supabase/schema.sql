-- Arch Consult — Auth stage database schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)
-- after creating your Supabase project.

-- Profiles table extends Supabase's built-in auth.users with the fields
-- Arch Consult needs. One row per user, keyed to auth.users.id.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

-- Row Level Security: users can only ever see/edit their own profile row.
-- This is the single most important security boundary in this schema —
-- without it, any authenticated user could read or edit anyone's profile.
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Automatically create a profiles row whenever someone signs up, pulling
-- full_name / business_name from the signup form's metadata. Runs with
-- elevated privileges (security definer) so it can insert despite RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, business_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'business_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- To make an account an admin later (e.g. your own, for the admin
-- dashboard stage), run this manually with the real user's id:
--   update public.profiles set role = 'admin' where id = '<user-uuid>';
