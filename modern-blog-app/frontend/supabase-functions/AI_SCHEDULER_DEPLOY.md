# AI Scheduler: deploy, operate, troubleshoot

Pipeline: `pg_cron` (every 2 min) → Supabase Edge Function `ai-scheduler-dispatch` → Vercel `POST /api/posts/ai/generate` → Tavily + Gemini → `ai_generated_posts`.

Files:
- Edge function: [ai-scheduler-dispatch/index.ts](ai-scheduler-dispatch/index.ts)
- Generator endpoint: [app/api/posts/ai/generate/route.ts](../app/api/posts/ai/generate/route.ts)
- One-time database setup: [docs/SUPABASE_SCHEDULER_SETUP.md](../docs/SUPABASE_SCHEDULER_SETUP.md)
- Scheduler SQL: `schedule_ai_scheduler.sql` (cron job), `schedule_ai_scheduler_2min.sql` (superseded notice), and `scheduler_diagnostics.sql` (checks)

## How a weekly sweep works

- **One call = one category batch (4 tools) = one post.** The catalog comes from `tools_coverage_metadata` (`is_active = true`). With the current 478 tools that is 69 categories and **146 batches**.
- A sweep **starts** at `ai_scheduler_config.weekly_dow` + `weekly_start_hour_utc` (default Monday 03:00 UTC = 08:30 IST). From then on every cron tick forwards the next batch: categories alphabetically, all batches of a category before the next category, at least `min_interval_minutes` apart. At 2 minutes: 146 × 2 min ≈ **4 h 50 min** (finished about 07:50 UTC).
- Progress is stored in `ai_scheduler_config`: `batch_cursor` (`{"<category>": <batches done>}`), `processed_this_week`, `cursor`, and `week_key` (= start of the current sweep).
- A sweep can only **start** during the first `SCHEDULER_START_WINDOW_HOURS` (24 h) after the weekly start, but a running sweep always continues until it is finished.
- A failed batch is retried on the next tick, up to `SCHEDULER_MAX_ATTEMPTS` (3), and then skipped (`gave_up: true` in the log) so one bad batch can never block the other categories. If the generator is busy, nothing changes and the next tick retries.
- Idle ticks (disabled, before the weekly start, interval not elapsed, sweep finished) are silent: nothing is written to `ai_scheduler_runs`.

## What was wrong (why only the first category got a post)

| # | Problem | Effect |
|---|---------|--------|
| 1 | Cron was `0 3 * * 1` (once a week) but one call only forwards **one** batch | 1 post per week: the first category's first batch |
| 2 | The 2-minute "sweep" file used `*/2 3 * * 1` (only the 03:00 hour) and the function only accepted exactly that hour | at most 30 ticks per week for 146 batches |
| 3 | `min_interval` compared against the **end** of the previous call (and ignored `x-sweep`) | every second tick skipped, only ~15 calls in that hour, 7 of 69 categories |
| 4 | The SQL files called `/functions/v1/ai-agent-posts`, the function is `ai-scheduler-dispatch` | a wrong URL means nothing runs at all |
| 5 | The old weekly job was never unscheduled when the sweep job was added | two jobs fired together and could forward the same batch twice |
| 6 | A failed batch never advanced, so the sweep stayed on it forever; "no posts generated", an HTML login page (HTTP 200) or a failed database insert counted as success and skipped batches | later categories never ran, or were skipped without a post |
| 7 | A request killed by the platform left a `running` lock for 10 minutes, blocking 5 ticks | long gaps in the sweep |
| 8 | Tavily had no timeout, Gemini could use the whole 45 s function limit | killed requests and stale locks |

## Deploy

1. **Vercel** environment variables: `CRON_SECRET` (any strong value), `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `GEMINI_API_KEY` (or `GOOGLE_GENERATIVE_AI_API_KEY`), `TAVILY_API_KEY`. Redeploy after changing them. The route now runs up to 60 s (`maxDuration`).
2. **Supabase function secrets** (`supabase secrets set NAME=value`):

   | Secret | Value |
   |--------|-------|
   | `CRON_TO_FUNCTION_SECRET` | must equal the vault secret `ai_sched_cron_secret` |
   | `PROD_BASE_URL` / `PROD_CRON_SECRET` | your production site URL / the same value as Vercel `CRON_SECRET` |
   | `PREVIEW_BASE_URL` / `PREVIEW_CRON_SECRET` | same for the preview deployment (only used when `mode = 'preview'`) |
   | optional `SCHEDULER_TOOLS_PER_BATCH` | 4 (never more than 4) |
   | optional `SCHEDULER_BATCHES_PER_CALL` | 1 (one Tavily + one Gemini call per tick) |
   | optional `SCHEDULER_MAX_ATTEMPTS` | 3 |
   | optional `SCHEDULER_FORWARD_TIMEOUT_MS` | 75000 |
   | optional `SCHEDULER_START_WINDOW_HOURS` | 24 |
   | optional `SCHEDULER_INTERVAL_GRACE_SECONDS` | 20 (absorbs cron jitter) |
   | optional `SCHEDULER_CHUNK_SIZE`, `SCHEDULER_PER_CALL_DELAY` | 1 and 0; keep as is |

3. **Deploy the function** (the CLI expects `supabase/functions/ai-scheduler-dispatch/index.ts`, so copy this folder there first, or paste the file in Dashboard → Edge Functions):

   ```bash
   supabase functions deploy ai-scheduler-dispatch --project-ref YOUR_PROJECT_REF
   ```

4. **Cron job**: run `schedule_ai_scheduler.sql` in the Supabase SQL editor. It removes every old scheduler job, creates the single `ai_scheduler_weekly_sweep` job (`*/2 * * * *`) and sets `enabled = true`, `mode = 'prod'`, `min_interval_minutes = 2`.
   Make sure the vault secret `ai_sched_fn_url` ends with `/functions/v1/ai-scheduler-dispatch`.
5. **Check the plan without generating anything** (dry run):

   ```bash
   curl -s -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-scheduler-dispatch" \
     -H "Authorization: Bearer YOUR_ANON_JWT" \
     -H "x-supa-cron-secret: YOUR_CRON_TO_FUNCTION_SECRET" \
     -H "x-dry-run: 1"
   ```

   The JSON shows `categories`, `total_tools`, `total_batches`, the `next` batch to run and `idle_reason` (why a normal tick would do nothing).

## Operate

- **Is it working?** Open the Supabase SQL editor and run `scheduler_diagnostics.sql`. Short version:

  ```sql
  -- exactly one job, short interval
  select jobid, jobname, schedule, active from cron.job where jobname like 'ai_scheduler%';
  -- what the function answered to the last ticks (404 = wrong URL, 401 = secret mismatch)
  select status_code, left(content::text, 200) as body, created from net._http_response order by created desc limit 10;
  -- progress and last results
  select enabled, mode, week_key, processed_this_week, last_run_at, batch_cursor from public.ai_scheduler_config where id = 1;
  select run_at, status, category, batch, details->>'reason' as reason, details->>'attempt' as attempt
  from public.ai_scheduler_runs order by run_at desc limit 30;
  ```

- **Pause:** `update public.ai_scheduler_config set enabled = false where id = 1;`
- **Run a sweep right now** (outside Monday): point the weekly start at the current UTC day/hour and clear the progress; restore `weekly_dow = 1`, `weekly_start_hour_utc = 3` afterwards.

  ```sql
  update public.ai_scheduler_config
  set weekly_dow = extract(dow from (now() at time zone 'utc'))::int,
      weekly_start_hour_utc = extract(hour from (now() at time zone 'utc'))::int,
      week_key = '', batch_cursor = '{}'::jsonb, cursor = 0, processed_this_week = 0,
      last_run_at = null, enabled = true
  where id = 1;
  ```

- **Manual alternative:** the admin dashboard can run one category/batch, or **all categories one after another** from the browser (keep the tab open).
- **Tick only on Mondays** (fewer idle calls): change the cron schedule to `*/2 * * * 1`. The cron day must match `weekly_dow`; the default `*/2 * * * *` has no such coupling.

## Troubleshooting

| What you see | Cause | Fix |
|--------------|-------|-----|
| Only one post per week | cron is `0 3 * * 1` | run `schedule_ai_scheduler.sql` |
| `net._http_response` status 404 | wrong function URL in vault `ai_sched_fn_url` | `vault.update_secret(...)` (see the SQL file) |
| status 401 from the function | `x-supa-cron-secret` ≠ `CRON_TO_FUNCTION_SECRET` | make both identical |
| `Missing target env vars` in `ai_scheduler_runs` | `PROD_BASE_URL` / `PROD_CRON_SECRET` not set (or `mode = 'preview'` without the preview ones) | set the secrets, check `mode` |
| `error` rows with `http_401` | Vercel `CRON_SECRET` ≠ `PROD_CRON_SECRET` | make both identical, redeploy Vercel |
| `error` rows with `http_307/403` or `non_json_response` | the target site is behind deployment protection / a redirect | use the production domain, not a protected preview URL |
| `error` rows with `no_post_saved` / HTTP 502 | posts were generated but the database insert failed (see Vercel logs) | fix the table/constraint, the batch is retried 3 times then skipped |
| status `skipped` + `Generation already in progress` | another generation is running; a killed run is released after 2 minutes | none, retried on the next tick |
| `idle_reason: waiting_for_weekly_start` | a new sweep can only start within 24 h after the weekly start | wait, or use the "run a sweep right now" SQL |
| Dashboard category list empty | `tools_coverage_metadata` has no active rows or RLS blocks the read | check the table and policies |
| `new row ... violates check constraint "valid_category"` when loading tools | the old 18-category CHECK is still on `tools_coverage_metadata` | `alter table tools_coverage_metadata drop constraint if exists valid_category;` |
