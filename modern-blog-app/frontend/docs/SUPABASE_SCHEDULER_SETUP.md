# Supabase Scheduler Setup (one-time)

Weekly AI post generation for every category and batch, driven by Supabase (`pg_cron` → Edge Function → your Vercel API).

How the sweep works, how to deploy/operate it and how to troubleshoot it is documented in
[supabase-functions/AI_SCHEDULER_DEPLOY.md](../supabase-functions/AI_SCHEDULER_DEPLOY.md). This file only covers the one-time setup.

## 1) Where each setting lives

| Place | Settings |
|-------|----------|
| Vercel (Preview and Production) | `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `GEMINI_API_KEY`, `TAVILY_API_KEY` |
| Supabase Edge Function secrets | `CRON_TO_FUNCTION_SECRET`, `PROD_BASE_URL`, `PROD_CRON_SECRET`, `PREVIEW_BASE_URL`, `PREVIEW_CRON_SECRET` (+ optional `SCHEDULER_*`, see the deploy guide) |
| Supabase defaults (do not add) | `SUPABASE_URL`, `SUPABASE_SECRET_KEYS`, `SUPABASE_PUBLISHABLE_KEYS` |
| Supabase Vault | `ai_sched_fn_url`, `ai_sched_anon_key`, `ai_sched_cron_secret` |

`PROD_CRON_SECRET` (Supabase) must equal `CRON_SECRET` (Vercel). Use different values for preview and production.
`ai_sched_anon_key` has to be the legacy JWT `anon` key because the cron call sends it as `apikey` and `Authorization: Bearer`.

## 2) Tables, extensions and secrets

Run in the Supabase SQL editor:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists vault;

create table if not exists public.ai_scheduler_config (
  id int primary key default 1,
  enabled boolean not null default false,
  mode text not null default 'preview' check (mode in ('preview', 'prod')),
  min_interval_minutes int not null default 2 check (min_interval_minutes >= 1),
  weekly_dow int not null default 1 check (weekly_dow between 0 and 6),      -- 0 = Sunday, 1 = Monday (UTC)
  weekly_start_hour_utc int not null default 3 check (weekly_start_hour_utc between 0 and 23),
  cursor int not null default 0,
  week_key text not null default '',
  processed_this_week int not null default 0,
  batch_cursor jsonb not null default '{}'::jsonb,
  last_run_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.ai_scheduler_config (id) values (1) on conflict (id) do nothing;

create table if not exists public.ai_scheduler_runs (
  id bigserial primary key,
  run_at timestamptz not null default now(),
  mode text,
  category text,
  batch int,
  status text not null,   -- started | success | error | skipped | completed
  details jsonb
);
```

Older installs also have a `categories text[]` column on `ai_scheduler_config`. It is no longer used: the category list always comes from
`tools_coverage_metadata`. It can stay or be dropped.

Categories are free text. If the old 18-category `valid_category` CHECK constraint is still on `tools_coverage_metadata`, remove it
(the 478-tool catalog has 69 categories):

```sql
alter table public.tools_coverage_metadata drop constraint if exists valid_category;
```

Vault secrets (replace the placeholders; `schedule_ai_scheduler.sql` creates them only when missing):

```sql
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-scheduler-dispatch', 'ai_sched_fn_url');
select vault.create_secret('YOUR_SUPABASE_ANON_KEY', 'ai_sched_anon_key');
select vault.create_secret('YOUR_CRON_TO_FUNCTION_SECRET', 'ai_sched_cron_secret');
```

## 3) Edge function

Source: [supabase-functions/ai-scheduler-dispatch/index.ts](../supabase-functions/ai-scheduler-dispatch/index.ts). Deploy it as described in the deploy guide.
Keep that file as the only copy of the code; do not paste it into other documents.

## 4) Cron job

Run the tracked `supabase-functions/schedule_ai_scheduler.sql` file in the Supabase SQL editor. It creates one job:

```sql
select cron.schedule(
  'ai_scheduler_weekly_sweep',
  '*/2 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'ai_sched_fn_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'ai_sched_anon_key'),
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'ai_sched_anon_key'),
      'x-supa-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'ai_sched_cron_secret')
    ),
    body := jsonb_build_object('source', 'supabase-scheduler'),
    timeout_milliseconds := 150000
  );
  $$
);
```

The job only "ticks"; the function decides whether a tick starts, continues or skips a sweep. Never schedule a second job for the same function.

## 5) Preview first, then production

```sql
-- test against the preview deployment
update public.ai_scheduler_config set enabled = true, mode = 'preview', min_interval_minutes = 2 where id = 1;

-- switch to production
update public.ai_scheduler_config set mode = 'prod' where id = 1;

-- emergency stop
update public.ai_scheduler_config set enabled = false where id = 1;
```

## 6) Will the posts show on the blog?

Yes. The blog API merges `ai_generated_posts` with `status = 'published'`, so every saved post appears in the blog and category listings.
