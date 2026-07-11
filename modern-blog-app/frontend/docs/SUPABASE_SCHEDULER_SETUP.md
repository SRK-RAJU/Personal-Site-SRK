# Supabase Scheduler Setup (Category + Batch, 5-Minute Gap)

This setup supports:
- One cron job
- Preview/prod mode switch
- Secure forwarding with secret headers
- One category per run with 5-minute spacing
- Batch-wise generation with automatic batch rotation (same behavior as manual admin when batch is not forced)

## 1) Vercel API Requirement

The generation API accepts either:
- Admin auth (existing dashboard/manual flow)
- `x-cron-secret` header (new scheduler flow)

Set in Vercel environment variables:
- `CRON_SECRET=<strong-random-secret>`

Use different secret values for preview and production environments.

## 2) Supabase SQL (extensions, config, logs, cron)

Run in Supabase SQL editor:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists vault;

create table if not exists public.ai_scheduler_config (
  id int primary key default 1,
  enabled boolean not null default false,
  mode text not null default 'preview' check (mode in ('preview', 'prod')),
  min_interval_minutes int not null default 5 check (min_interval_minutes >= 1),
  weekly_dow int not null default 1 check (weekly_dow between 0 and 6),
  weekly_start_hour_utc int not null default 3 check (weekly_start_hour_utc between 0 and 23),
  categories text[] not null default array[
    'AI/ML','Cloud','Security','Infrastructure','Container','Delivery',
    'Observability','Database','Data','Networking','Identity','Developer',
    'Operations','ERP','CRM','Marketing','HR'
  ],
  cursor int not null default 0,
  week_key text not null default '',
  processed_this_week int not null default 0,
  last_run_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.ai_scheduler_config (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.ai_scheduler_runs (
  id bigserial primary key,
  run_at timestamptz not null default now(),
  mode text,
  category text,
  batch int,
  status text not null,
  details jsonb
);

-- Vault secrets used by cron -> edge function call
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-scheduler-dispatch', 'ai_sched_fn_url')
where not exists (select 1 from vault.secrets where name = 'ai_sched_fn_url');

select vault.create_secret('YOUR_SUPABASE_ANON_KEY', 'ai_sched_anon_key')
where not exists (select 1 from vault.secrets where name = 'ai_sched_anon_key');

select vault.create_secret('YOUR_CRON_TO_FUNCTION_SECRET', 'ai_sched_cron_secret')
where not exists (select 1 from vault.secrets where name = 'ai_sched_cron_secret');

-- One cron job every 5 minutes
select cron.unschedule('ai_scheduler_every_5m')
where exists (select 1 from cron.job where jobname = 'ai_scheduler_every_5m');

select cron.schedule(
  'ai_scheduler_every_5m',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'ai_sched_fn_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'ai_sched_anon_key'),
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'ai_sched_anon_key'),
      'x-supa-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'ai_sched_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## 3) Supabase Edge Function: ai-scheduler-dispatch

Create function file with this code:

```ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ConfigRow = {
  id: number;
  enabled: boolean;
  mode: "preview" | "prod";
  min_interval_minutes: number;
  weekly_dow: number;
  weekly_start_hour_utc: number;
  categories: string[];
  cursor: number;
  week_key: string;
  processed_this_week: number;
  last_run_at: string | null;
};

function utcWeekKey(d: Date): string {
  const year = d.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const day = Math.floor((d.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((day + start.getUTCDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

async function logRun(
  supabase: any,
  status: string,
  mode?: string,
  category?: string,
  batch?: number,
  details?: Record<string, unknown>
) {
  await supabase.from("ai_scheduler_runs").insert({
    status,
    mode: mode ?? null,
    category: category ?? null,
    batch: batch ?? null,
    details: details ?? null,
  });
}

serve(async (req) => {
  try {
    const inboundSecret = req.headers.get("x-supa-cron-secret") || "";
    const expectedInbound = Deno.env.get("CRON_TO_FUNCTION_SECRET") || "";
    if (!expectedInbound || inboundSecret !== expectedInbound) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS") || "{}";
    let serviceRole = "";
    try {
      const parsed = JSON.parse(secretKeysRaw);
      serviceRole = parsed?.default || "";
    } catch {
      serviceRole = "";
    }
    if (!serviceRole) {
      serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    }
    if (!supabaseUrl || !serviceRole) {
      return new Response(JSON.stringify({ ok: false, error: "Missing Supabase env" }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    const { data: cfg, error: cfgErr } = await supabase
      .from("ai_scheduler_config")
      .select("*")
      .eq("id", 1)
      .single<ConfigRow>();

    if (cfgErr || !cfg) {
      await logRun(supabase, "error", undefined, undefined, undefined, { step: "load_config", message: cfgErr?.message });
      return new Response(JSON.stringify({ ok: false, error: "Config load failed" }), { status: 500 });
    }

    if (!cfg.enabled) {
      await logRun(supabase, "skipped", cfg.mode, undefined, undefined, { reason: "disabled" });
      return Response.json({ ok: true, skipped: true, reason: "disabled" });
    }

    const now = new Date();
    const dow = now.getUTCDay();
    const hour = now.getUTCHours();

    if (dow !== cfg.weekly_dow || hour < cfg.weekly_start_hour_utc) {
      await logRun(supabase, "skipped", cfg.mode, undefined, undefined, { reason: "outside_weekly_window", dow, hour });
      return Response.json({ ok: true, skipped: true, reason: "outside_weekly_window" });
    }

    if (cfg.last_run_at) {
      const last = new Date(cfg.last_run_at).getTime();
      const diffMin = (Date.now() - last) / 60000;
      if (diffMin < cfg.min_interval_minutes) {
        await logRun(supabase, "skipped", cfg.mode, undefined, undefined, { reason: "min_interval", diffMin });
        return Response.json({ ok: true, skipped: true, reason: "min_interval" });
      }
    }

    const currentWeek = utcWeekKey(now);
    let cursor = cfg.cursor;
    let processed = cfg.processed_this_week;
    let weekKey = cfg.week_key || "";

    if (weekKey !== currentWeek) {
      cursor = 0;
      processed = 0;
      weekKey = currentWeek;
    }

    const categories = Array.isArray(cfg.categories) ? cfg.categories : [];
    if (categories.length === 0) {
      await logRun(supabase, "skipped", cfg.mode, undefined, undefined, { reason: "no_categories" });
      return Response.json({ ok: true, skipped: true, reason: "no_categories" });
    }

    if (processed >= categories.length) {
      await logRun(supabase, "skipped", cfg.mode, undefined, undefined, { reason: "week_completed", currentWeek });
      return Response.json({ ok: true, skipped: true, reason: "week_completed" });
    }

    const idx = cursor % categories.length;
    const category = categories[idx];
    const targetBase = cfg.mode === "prod"
      ? (Deno.env.get("PROD_BASE_URL") || "")
      : (Deno.env.get("PREVIEW_BASE_URL") || "");

    const targetSecret = cfg.mode === "prod"
      ? (Deno.env.get("PROD_CRON_SECRET") || "")
      : (Deno.env.get("PREVIEW_CRON_SECRET") || "");

    if (!targetBase || !targetSecret) {
      await logRun(supabase, "error", cfg.mode, category, undefined, { reason: "missing_target_env" });
      return new Response(JSON.stringify({ ok: false, error: "Missing target env vars" }), { status: 500 });
    }

    const targetUrl = `${targetBase.replace(/\/+$/, "")}/api/posts/ai/generate`;

    const forwardRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": targetSecret,
        "x-trigger-source": "supabase-scheduler",
      },
      body: JSON.stringify({
        source: "supabase-scheduler",
        mode: "single-category",
        category,
      }),
    });

    const forwardText = await forwardRes.text();
    const ok = forwardRes.ok;

    const nextCursor = (idx + 1) % categories.length;
    const nextProcessed = processed + 1;

    await supabase
      .from("ai_scheduler_config")
      .update({
        cursor: nextCursor,
        processed_this_week: nextProcessed,
        week_key: weekKey,
        last_run_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", 1);

    await logRun(
      supabase,
      ok ? "success" : "error",
      cfg.mode,
      category,
      undefined,
      { status: forwardRes.status, body: forwardText.slice(0, 2000), cursor: nextCursor, processed_this_week: nextProcessed }
    );

    return Response.json({
      ok,
      mode: cfg.mode,
      category,
      status: forwardRes.status,
      processed_this_week: nextProcessed,
      total_categories: categories.length,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
```

## 4) Edge Function Environment Variables

Set these function secrets in Supabase:
- `CRON_TO_FUNCTION_SECRET`
- `PREVIEW_BASE_URL`
- `PROD_BASE_URL`
- `PREVIEW_CRON_SECRET`
- `PROD_CRON_SECRET`
- `SUPABASE_URL`

Default secrets are provided by Supabase automatically:
- `SUPABASE_SECRET_KEYS` (preferred for admin/server operations)
- `SUPABASE_PUBLISHABLE_KEYS` (preferred for public client operations)
- Legacy: `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` may still exist

You usually do not need to manually add `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` in Edge Function secrets.

Note: the SQL cron caller in this guide sets both `apikey` and `Authorization: Bearer ...` headers when invoking the Edge Function. Keep `ai_sched_anon_key` as the legacy JWT `anon` key for this pattern.

### Environment Ownership (Important)

- Vercel envs are for your Next.js API route.
- Supabase Edge Function secrets are for the scheduler function.
- They are not the same set and should not be copied 1:1.

Set in Vercel (Preview and Production projects/environments):
- `CRON_SECRET`

Set in Supabase Edge Function Secrets:
- `CRON_TO_FUNCTION_SECRET`
- `PREVIEW_BASE_URL`
- `PROD_BASE_URL`
- `PREVIEW_CRON_SECRET`
- `PROD_CRON_SECRET`

Supabase-provided defaults (do not re-add unless needed):
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEYS`
- `SUPABASE_PUBLISHABLE_KEYS`

## 5) Preview First, Then Prod

Enable preview mode first:

```sql
update public.ai_scheduler_config
set enabled = true, mode = 'preview', min_interval_minutes = 5, updated_at = now()
where id = 1;
```

Switch to production after testing:

```sql
update public.ai_scheduler_config
set mode = 'prod', updated_at = now()
where id = 1;
```

Emergency stop:

```sql
update public.ai_scheduler_config
set enabled = false, updated_at = now()
where id = 1;
```

## 6) Will Posts Show in Blog Page?

Yes. Your blog listing API already includes AI-generated posts (enabled by default), so once a scheduled post is saved with published status, it will be shown in blog/posts pages.

## 7) Category + Batch Rotation Behavior

- Every 5 minutes the scheduler picks the next category from `categories` by `cursor`.
- For that category, the API computes the next batch automatically from published history.
- This matches manual admin behavior when batch is not explicitly selected.

## 8) If It Is Already Running, How To Update Safely

1. Pause scheduler:

```sql
update public.ai_scheduler_config
set enabled = false, updated_at = now()
where id = 1;
```

2. Redeploy Edge Function with the latest code from this document.

3. Ensure Vercel `CRON_SECRET` values are set correctly for both Preview and Production.

4. Confirm Supabase Edge Function secrets are updated:
- `PREVIEW_BASE_URL`
- `PROD_BASE_URL`
- `PREVIEW_CRON_SECRET`
- `PROD_CRON_SECRET`
- `CRON_TO_FUNCTION_SECRET`

5. Optional reset for a clean weekly cycle:

```sql
update public.ai_scheduler_config
set cursor = 0,
    processed_this_week = 0,
    week_key = '',
    last_run_at = null,
    updated_at = now()
where id = 1;
```

6. Re-enable scheduler in the target mode:

```sql
update public.ai_scheduler_config
set enabled = true, mode = 'preview', min_interval_minutes = 5, updated_at = now()
where id = 1;
```

7. After preview validation, switch to production:

```sql
update public.ai_scheduler_config
set mode = 'prod', min_interval_minutes = 5, updated_at = now()
where id = 1;
```

8. Verify latest runs:

```sql
select run_at, mode, category, status
from public.ai_scheduler_runs
order by run_at desc
limit 20;
```
