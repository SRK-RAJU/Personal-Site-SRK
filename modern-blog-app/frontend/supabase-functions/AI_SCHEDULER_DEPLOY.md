Overview

This document shows the exact steps to deploy and run the updated `ai-scheduler-dispatch` Supabase function, set required envs/secrets, configure DB `min_interval_minutes`, and schedule a safe 2-minute spaced sweep during the weekly Monday 03:00 UTC window.

Files changed (already in repo)
- [ai-scheduler-dispatch function](supabase-functions/ai-scheduler-dispatch/index.ts)
- [generator endpoint](app/api/posts/ai/generate/route.ts)
- SQL: [schedule_ai_scheduler.sql](supabase-functions/schedule_ai_scheduler.sql)

Goals
- Ensure one API call per batch (4 tools) with >=2 minute spacing between LLM calls.
- Keep scheduler state safe: `ai_scheduler_config.batch_cursor` and `processed_this_week` advance on success.
- Save backups on DB insert failure and avoid infinite retries.

Recommended env values (Supabase function)
- SCHEDULER_CHUNK_SIZE=1
- SCHEDULER_BATCHES_PER_CALL=1
- SCHEDULER_TOOLS_PER_BATCH=4
- SCHEDULER_PER_CALL_DELAY=0
- CRON_TO_FUNCTION_SECRET=<your-secret>
- PROD_BASE_URL=<your-vercel-base>
- PREVIEW_BASE_URL=<your-preview-base>
- PROD_CRON_SECRET=<prod-cron-secret>
- PREVIEW_CRON_SECRET=<preview-cron-secret>

Supabase CLI / Deploy steps
1. Build & deploy the function (run in project root):

```bash
supabase functions deploy ai-scheduler-dispatch --project-ref YOUR_PROJECT_REF
```

2. Set secrets (example):

```bash
supabase secrets set SCHEDULER_CHUNK_SIZE=1
supabase secrets set SCHEDULER_BATCHES_PER_CALL=1
supabase secrets set SCHEDULER_TOOLS_PER_BATCH=4
supabase secrets set SCHEDULER_PER_CALL_DELAY=0
supabase secrets set CRON_TO_FUNCTION_SECRET="<your-secret>"
# Also ensure your DB/target secrets are set (SUPABASE keys, PROD_BASE_URL etc.)
```

DB changes (run in Supabase SQL editor)
1. Require min interval of 2 minutes:

```sql
UPDATE public.ai_scheduler_config
SET min_interval_minutes = 2, enabled = true
WHERE id = 1;
```

2. Optional: inspect per-category batch counts (compute estimated minutes):

```sql
SELECT
  category,
  COUNT(*) AS tool_count,
  CEIL(COUNT(*)::numeric / 4.0) AS batches
FROM public.tools_coverage_metadata
WHERE is_active = true
GROUP BY category
ORDER BY category;
```

Schedule cron jobs
1. Weekly starter: (use existing `schedule_ai_scheduler.sql` or run in SQL editor) — keeps weekly `0 3 * * 1`.
2. 2-minute sweep during 03:00 Monday (example): run the provided `schedule_ai_scheduler_2min.sql` (edit placeholders):

File: [schedule_ai_scheduler_2min.sql](supabase-functions/schedule_ai_scheduler_2min.sql)

This schedules a cron job `ai_scheduler_sweep_2min` that will POST to the dispatch function every 2 minutes during 03:00 hour on Mondays. Adjust cron expression to widen the window if needed.

Monitor & verification
- Check cron jobs:

```sql
SELECT jobid, jobname, schedule, last_start, last_finish FROM cron.job;
```

- Check progress and logs:
  - `public.ai_scheduler_runs` — each forward logged.
  - `public.ai_scheduler_config` — `batch_cursor` and `processed_this_week` fields should advance.
  - Vercel or Next logs for `/api/posts/ai/generate` for any DB insert warnings.

Rollbacks & cleanup
- Unschedule sweep job:

```sql
SELECT cron.unschedule('ai_scheduler_sweep_2min') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ai_scheduler_sweep_2min');
```

- Disable scheduler in DB:

```sql
UPDATE public.ai_scheduler_config SET enabled = false WHERE id = 1;
```

Notes & safety
- Keep `SCHEDULER_BATCHES_PER_CALL=1` so each invocation results in 1 Tavily + 1 Gemini call.
- Use DB `min_interval_minutes` + cron spacing to enforce >=2 minutes between LLM calls.
- The generator returns `200` + `warning` on DB insert failure and backups are saved; scheduler treats 200 as success and will advance the cursor.

If you want, I can also:
- Produce a ready-to-run `pg_cron` SQL file that temporarily creates a per-minute job that self-unschedules after X minutes (requires procedural control in Postgres or an external controller).
- Or compute exact total minutes for your dataset if you run the per-category batch-count query and paste results here.
