-- Arch Consult — Admin dashboard database changes
-- Run in Supabase SQL Editor (New query), after 004_payments.sql.
-- Safe to run more than once.

-- 1. Helper: is the signed-in user an admin?
--    security definer lets it read profiles without triggering RLS loops.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 2. SECURITY FIX: stop users promoting themselves to admin.
--    The original "Users can update own profile" policy let a user edit ANY
--    column of their own row, including role. This trigger blocks role
--    changes unless the change comes from an existing admin, or from the
--    Supabase dashboard/SQL editor (where there is no signed-in user).
create or replace function public.prevent_role_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin can change roles.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_role_self_change();

-- 3. Internal notes on bookings (status already exists from 002_bookings.sql)
alter table public.bookings add column if not exists admin_notes text;

-- 4. Admins can read/update all bookings (includes guest bookings)
drop policy if exists "Admins can view all bookings" on public.bookings;
create policy "Admins can view all bookings"
  on public.bookings for select
  using (public.is_admin());

drop policy if exists "Admins can update bookings" on public.bookings;
create policy "Admins can update bookings"
  on public.bookings for update
  using (public.is_admin())
  with check (public.is_admin());

-- 5. Admins can read (never write) profiles, reports and payments
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Admins can view all reports" on public.reports;
create policy "Admins can view all reports"
  on public.reports for select
  using (public.is_admin());

drop policy if exists "Admins can view all payments" on public.payments;
create policy "Admins can view all payments"
  on public.payments for select
  using (public.is_admin());
