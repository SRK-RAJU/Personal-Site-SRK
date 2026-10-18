-- Scheduler diagnostics: run these in the Supabase SQL editor, top to bottom, to see why posts are (not) generated.

-- 1) Is there exactly ONE active ai_scheduler job, and is its schedule a short interval?
--    ('0 3 * * 1' = once a week = one post per week.  Two jobs = duplicate/overlapping forwards.)
select jobid, jobname, schedule, active from cron.job where jobname like 'ai_scheduler%';

-- 2) Did cron fire recently?
select jobid, status, return_message, start_time, end_time
from cron.job_run_details
where jobid in (select jobid from cron.job where jobname like 'ai_scheduler%')
order by start_time desc
limit 20;

-- 3) What did the edge function answer to each tick? (pg_net keeps roughly the last 6 hours)
--    reason = disabled | min_interval | waiting_for_weekly_start | week_completed | claimed_by_another_tick
--    status_code 404 => the URL in vault 'ai_sched_fn_url' is wrong (must end with /ai-scheduler-dispatch)
--    status_code 401 => x-supa-cron-secret does not match the function secret CRON_TO_FUNCTION_SECRET
select id, status_code, timed_out, error_msg, left(content::text, 300) as body, created
from net._http_response
order by created desc
limit 20;

-- 4) Scheduler state
select enabled, mode, weekly_dow, weekly_start_hour_utc, min_interval_minutes,
       week_key, cursor, processed_this_week, last_run_at, batch_cursor
from public.ai_scheduler_config
where id = 1;

-- 5) Latest activity. status: started | success | error | skipped | completed
--    A failing batch shows attempt 1,2,3 and then gave_up = true (it is skipped so the sweep continues).
select run_at, status, category, batch,
       details->>'reason' as reason,
       details->>'http_status' as http,
       details->>'attempt' as attempt,
       details->>'gave_up' as gave_up,
       details->>'completed_batches' as done_batches,
       details->>'total_batches' as total_batches
from public.ai_scheduler_runs
order by run_at desc
limit 40;

-- 6) How many categories / batches does one full sweep need?
select count(*) as categories, sum(tools) as tools, sum(ceil(tools / 4.0)) as batches
from (
  select lower(trim(category)) as category, count(*) as tools
  from public.tools_coverage_metadata
  where is_active = true and category is not null
  group by 1
) t;

-- 7) Generator lock: a 'running' row younger than 2 minutes blocks scheduler calls (older ones are released)
select run_id, status, scheduled_time, error_message
from public.ai_generation_logs
order by scheduled_time desc
limit 15;

-- 8) Posts saved per category in the last 7 days
select category, count(*) as posts, max(published_at) as latest
from public.ai_generated_posts
where published_at >= now() - interval '7 days'
group by 1
order by 1;

-- ---------------------------------------------------------------------------------------------------------
-- Start a fresh sweep right now (outside the normal weekly start): point the weekly start at the current UTC
-- day/hour and clear progress. Restore weekly_dow = 1 and weekly_start_hour_utc = 3 afterwards.
-- update public.ai_scheduler_config
-- set weekly_dow = extract(dow from (now() at time zone 'utc'))::int,
--     weekly_start_hour_utc = extract(hour from (now() at time zone 'utc'))::int,
--     week_key = '', batch_cursor = '{}'::jsonb, cursor = 0, processed_this_week = 0,
--     last_run_at = null, enabled = true, updated_at = now()
-- where id = 1;
--
-- Pause everything:
-- update public.ai_scheduler_config set enabled = false, updated_at = now() where id = 1;
