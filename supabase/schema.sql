-- AI Atlas database schema for Supabase.
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
drop policy if exists "progress: insert own" on public.lesson_progress;
create policy "progress: insert own" on public.lesson_progress for insert with check (auth.uid() = user_id);
drop policy if exists "progress: update own" on public.lesson_progress;
create policy "progress: update own" on public.lesson_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "progress: delete own" on public.lesson_progress;
create policy "progress: delete own" on public.lesson_progress for delete using (auth.uid() = user_id);

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

-- Final exam: its result is one lesson_progress row with lesson_id 'final-exam'
-- and a score out of 50, so databases created before the exam need a wider check.
alter table public.lesson_progress drop constraint if exists lesson_progress_best_score_check;
alter table public.lesson_progress add constraint lesson_progress_best_score_check check (best_score between 0 and 50);
