-- Modern AI Engineering (AI Engineering Bootcamp) database schema for Supabase.
-- Run once: Supabase dashboard → SQL Editor → paste this file → Run.
-- Safe to run again; every statement is idempotent.

-- One row per account: the editable profile shown on /profile.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '' check (char_length(full_name) <= 80),
  avatar_url text not null default '',
  bio text not null default '' check (char_length(bio) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per learner per lesson: best quiz score and whether it is passed.
create table if not exists public.lesson_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^[a-z0-9-]{1,80}$'),
  best_score smallint not null default 0 check (best_score between 0 and 50),  -- lesson quizzes score 0-5; the final exam row scores 0-50
  passed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- Row-level security: every learner reads and writes only their own rows.
alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "progress: read own" on public.lesson_progress;
create policy "progress: read own" on public.lesson_progress for select using (auth.uid() = user_id);
-- Learners can read their progress but not write it: quiz and exam scores are
-- saved by the server after it marks them (api/quiz.js, api/exam.js).
drop policy if exists "progress: insert own" on public.lesson_progress;
drop policy if exists "progress: update own" on public.lesson_progress;
drop policy if exists "progress: delete own" on public.lesson_progress;

-- Create the profile automatically on sign-up, filled from the Google account
-- (name and picture) when there is one.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), ''), 80),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Practice page: Python files a learner saves from the in-browser editor.
create table if not exists public.code_snippets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'untitled.py' check (char_length(title) between 1 and 80),
  code text not null default '' check (char_length(code) <= 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists code_snippets_user_recent on public.code_snippets (user_id, updated_at desc);

alter table public.code_snippets enable row level security;
drop policy if exists "snippets: read own" on public.code_snippets;
create policy "snippets: read own" on public.code_snippets for select using (auth.uid() = user_id);
drop policy if exists "snippets: insert own" on public.code_snippets;
create policy "snippets: insert own" on public.code_snippets for insert with check (auth.uid() = user_id);
drop policy if exists "snippets: update own" on public.code_snippets;
create policy "snippets: update own" on public.code_snippets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "snippets: delete own" on public.code_snippets;
create policy "snippets: delete own" on public.code_snippets for delete using (auth.uid() = user_id);

-- Plans a learner has bought. Learners can only read their own rows: there are
-- no insert/update/delete policies, so plans are granted from the dashboard or
-- by a trusted server (for example a payment webhook using the service role).
create table if not exists public.entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  track text not null check (track in ('ml', 'ai', 'complete')),
  period text not null default 'lifetime' check (period in ('monthly', 'quarter', 'lifetime')),
  expires_at timestamptz,            -- null means it never expires
  created_at timestamptz not null default now(),
  primary key (user_id, track)
);
alter table public.entitlements enable row level security;
drop policy if exists "entitlements: read own" on public.entitlements;
create policy "entitlements: read own" on public.entitlements for select using (auth.uid() = user_id);

-- Payments made through Dodo Payments, one row per payment. Written only by the
-- site's webhook (using the service role); learners can read their own rows.
create table if not exists public.payments (
  payment_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  track text not null check (track in ('ml', 'ai', 'complete')),
  period text not null check (period in ('monthly', 'quarter', 'lifetime')),
  currency text not null,
  amount integer not null,            -- in the currency's smallest unit (paise or cents), tax included
  status text not null default 'succeeded' check (status in ('succeeded', 'refunded')),
  created_at timestamptz not null default now(),
  refunded_at timestamptz
);
create index if not exists payments_user on public.payments (user_id, created_at desc);
alter table public.payments enable row level security;
drop policy if exists "payments: read own" on public.payments;
create policy "payments: read own" on public.payments for select using (auth.uid() = user_id);

-- Final exam: its result is one lesson_progress row with lesson_id 'final-exam'
-- and a score out of 50, so databases created before the exam need a wider check.
alter table public.lesson_progress drop constraint if exists lesson_progress_best_score_check;
alter table public.lesson_progress add constraint lesson_progress_best_score_check check (best_score between 0 and 50);

-- Admin reporting: who has signed up and how, their progress, and whether they
-- have a plan. Read these from the Supabase dashboard (Table Editor, or
-- `select * from admin_summary;` in the SQL Editor). They run with the caller's
-- rights and are not granted to the public API roles, so learners cannot read them.
drop view if exists public.admin_summary;
drop view if exists public.admin_learners;
create view public.admin_learners with (security_invoker = on) as
select
  u.id as user_id,
  u.email,
  coalesce(nullif(p.full_name, ''), u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '') as full_name,
  coalesce(u.raw_app_meta_data ->> 'provider', 'email') as sign_in_method,   -- 'google' or 'email'
  u.email_confirmed_at is not null as email_confirmed,
  u.created_at as joined_at,
  u.last_sign_in_at,
  lp.lessons_passed,
  lp.quizzes_attempted,
  lp.average_best_score,
  lp.final_exam_score,
  lp.final_exam_passed,
  lp.last_progress_at,
  e.plans is not null as has_plan,
  e.plans
from auth.users u
left join public.profiles p on p.id = u.id
cross join lateral (
  select
    count(*) filter (where passed and lesson_id <> 'final-exam') as lessons_passed,
    count(*) filter (where lesson_id <> 'final-exam') as quizzes_attempted,
    round(avg(best_score) filter (where lesson_id <> 'final-exam'), 2) as average_best_score,
    max(best_score) filter (where lesson_id = 'final-exam') as final_exam_score,
    coalesce(bool_or(passed) filter (where lesson_id = 'final-exam'), false) as final_exam_passed,
    max(updated_at) as last_progress_at
  from public.lesson_progress where user_id = u.id
) lp
cross join lateral (
  select string_agg(track || ' (' || period || ')', ', ' order by track) as plans
  from public.entitlements where user_id = u.id and (expires_at is null or expires_at > now())
) e
order by u.created_at desc;

create view public.admin_summary with (security_invoker = on) as
select
  count(*) as total_users,
  count(*) filter (where sign_in_method = 'google') as google_users,
  count(*) filter (where sign_in_method = 'email') as email_users,
  count(*) filter (where has_plan) as users_with_plan,
  count(*) filter (where not has_plan) as users_without_plan,
  count(*) filter (where lessons_passed > 0) as users_with_progress,
  count(*) filter (where final_exam_passed) as users_passed_exam,
  count(*) filter (where last_sign_in_at > now() - interval '7 days') as active_last_7_days,
  count(*) filter (where joined_at > now() - interval '7 days') as new_last_7_days
from public.admin_learners;

revoke all on public.admin_learners, public.admin_summary from anon, authenticated;

-- To give a learner a plan (until a payment provider does it), run for example:
--   insert into public.entitlements (user_id, track, period)
--   select id, 'complete', 'lifetime' from auth.users where email = 'learner@example.com'
--   on conflict (user_id, track) do update set period = excluded.period, expires_at = excluded.expires_at;
