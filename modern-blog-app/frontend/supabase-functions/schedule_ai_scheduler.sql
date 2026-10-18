-- AI scheduler: ONE pg_cron job drives the whole weekly sweep.
--
-- Why a short interval?  Every call of the edge function forwards exactly ONE category batch (4 tools).
-- There are ~146 batches (69 categories), so the function has to be called many times per week.
-- A single weekly call (the old '0 3 * * 1') can only ever generate ONE post per week.
--
-- The cron only "ticks". ai-scheduler-dispatch decides what to do:
--   * before the weekly start (ai_scheduler_config.weekly_dow / weekly_start_hour_utc) -> idle
--   * from the weekly start -> works through every category/batch, one per tick (min_interval_minutes apart)
--   * everything done -> idle until the next weekly start
-- It is safe to leave this job running all week (idle ticks are cheap and are not logged).
--
-- To tick only on Mondays use '*/2 * * * 1' instead (the day must match weekly_dow).

-- 1) Remove every previous scheduler job so two jobs never fire at the same time.
select cron.unschedule(jobname)
from cron.job
where jobname in (
  'ai_scheduler_every_5m',
  'ai_scheduler_sweep_2min',
  'ai_scheduler_weekly_prod',
  'ai_scheduler_weekly_sweep'
);

-- 2) Vault secrets used by the job. Created only when missing; check the values in step 4.
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-scheduler-dispatch', 'ai_sched_fn_url')
where not exists (select 1 from vault.secrets where name = 'ai_sched_fn_url');

select vault.create_secret('YOUR_SUPABASE_ANON_KEY', 'ai_sched_anon_key')
where not exists (select 1 from vault.secrets where name = 'ai_sched_anon_key');

select vault.create_secret('YOUR_CRON_TO_FUNCTION_SECRET', 'ai_sched_cron_secret')
where not exists (select 1 from vault.secrets where name = 'ai_sched_cron_secret');

-- 3) The job. timeout_milliseconds is long on purpose: one forward (Tavily + Gemini + save) takes up to ~60s
--    and pg_net's default of 5s would just record a misleading timeout.
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

-- 4) Verify. Exactly one ai_scheduler_* job must be listed, and the URL must end with /ai-scheduler-dispatch.
--    If the URL is wrong, fix it with:
--      select vault.update_secret((select id from vault.secrets where name = 'ai_sched_fn_url'),
--                                 'https://<ref>.supabase.co/functions/v1/ai-scheduler-dispatch');
select jobid, jobname, schedule, active from cron.job where jobname like 'ai_scheduler%';
select name, decrypted_secret as value from vault.decrypted_secrets where name = 'ai_sched_fn_url';

-- 5) Scheduler config for the sweep (2 minutes between generator calls, enabled, production target).
update public.ai_scheduler_config
set enabled = true,
    mode = 'prod',
    min_interval_minutes = 2,
    updated_at = now()
where id = 1;
