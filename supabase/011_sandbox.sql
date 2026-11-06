-- Arch Consult - Sandbox access control
-- Run this in the Supabase SQL Editor, in addition to the earlier files.

create table if not exists public.sandbox_simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inputs jsonb not null,
  ctx jsonb not null,
  state_name text,
  advisor_questions_used int not null default 0,
  was_free boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists sandbox_simulations_user_created
  on public.sandbox_simulations (user_id, created_at desc);

-- One free simulation per account, enforced by the database itself so two quick
-- clicks can never create two free runs.
create unique index if not exists sandbox_one_free_per_user
  on public.sandbox_simulations (user_id) where was_free;

alter table public.sandbox_simulations enable row level security;

-- Deliberately no INSERT or UPDATE policy: every write happens on the server with
-- the service-role key, after checking the person's verified email and payments.
drop policy if exists "Users can view own simulations" on public.sandbox_simulations;
create policy "Users can view own simulations"
  on public.sandbox_simulations for select
  using (auth.uid() = user_id);

-- Counts one advisor question. Returns the new count, or null when the limit is reached.
create or replace function public.sandbox_use_question(p_sim uuid, p_user uuid, p_limit int)
returns int language sql as $$
  update public.sandbox_simulations
     set advisor_questions_used = advisor_questions_used + 1
   where id = p_sim and user_id = p_user and advisor_questions_used < p_limit
  returning advisor_questions_used;
$$;

-- Gives a question back when the AI provider failed.
create or replace function public.sandbox_refund_question(p_sim uuid, p_user uuid)
returns void language sql as $$
  update public.sandbox_simulations
     set advisor_questions_used = greatest(0, advisor_questions_used - 1)
   where id = p_sim and user_id = p_user;
$$;

revoke all on function public.sandbox_use_question(uuid, uuid, int) from public, anon, authenticated;
revoke all on function public.sandbox_refund_question(uuid, uuid) from public, anon, authenticated;
