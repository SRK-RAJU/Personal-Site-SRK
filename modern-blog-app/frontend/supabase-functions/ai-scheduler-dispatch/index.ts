// @ts-nocheck
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
  batch_cursor?: Record<string, number> | null;
  last_run_at: string | null;
};

function utcWeekKey(d: Date): string {
  const year = d.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const day = Math.floor((d.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((day + start.getUTCDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function getWeeklyStartUtc(now: Date, weeklyDow: number, weeklyHourUtc: number): Date {
  const dayStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0,
    0,
    0,
    0
  ));
  const currentDow = dayStart.getUTCDay();
  const delta = (currentDow - weeklyDow + 7) % 7;
  dayStart.setUTCDate(dayStart.getUTCDate() - delta);
  dayStart.setUTCHours(weeklyHourUtc, 0, 0, 0);

  if (dayStart.getTime() > now.getTime()) {
    dayStart.setUTCDate(dayStart.getUTCDate() - 7);
  }

  return dayStart;
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

function getServiceRoleKey(): string {
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS") || "{}";
  try {
    const parsed = JSON.parse(secretKeysRaw);
    const role = parsed?.default;
    if (typeof role === "string" && role.trim()) {
      return role.trim();
    }
  } catch {
    // fall back to legacy env
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

async function getCategoryBatchCount(supabase: any, category: string): Promise<number> {
  const schedulerBatchSize = Number(Deno.env.get("SCHEDULER_TOOLS_PER_BATCH") || "4");
  const { count, error } = await supabase
    .from("tools_coverage_metadata")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .ilike("category", category);

  if (error) {
    return 0;
  }

  const totalTools = count || 0;
  if (totalTools <= 0) {
    return 0;
  }

  return Math.ceil(totalTools / schedulerBatchSize);
}

async function getActiveCategories(supabase: any): Promise<string[]> {
  const { data, error } = await supabase
    .from("tools_coverage_metadata")
    .select("category")
    .eq("is_active", true)
    .not("category", "is", null)
    .order("category", { ascending: true });

  if (error || !data) {
    return [];
  }

  const rows = data as Array<{ category?: string | null }>;
  const normalized = rows
    .map((row) => String(row.category || "").trim())
    .filter((value) => value.length > 0);

  const categories: string[] = Array.from(new Set(normalized));

  return categories;
}

serve(async (req) => {
  try {
    const inboundSecret = req.headers.get("x-supa-cron-secret") || "";
    const expectedInbound = Deno.env.get("CRON_TO_FUNCTION_SECRET") || "";
    if (!expectedInbound || inboundSecret !== expectedInbound) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRole = getServiceRoleKey();
    if (!supabaseUrl || !serviceRole) {
      return new Response(JSON.stringify({ ok: false, error: "Missing Supabase env" }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    const { data: cfgData, error: cfgErr } = await supabase
      .from("ai_scheduler_config")
      .select("*")
      .eq("id", 1)
      .single();

    const cfg = (cfgData ?? null) as ConfigRow | null;

    if (cfgErr || !cfg) {
      await logRun(supabase, "error", undefined, undefined, undefined, { step: "load_config", message: cfgErr?.message });
      return new Response(JSON.stringify({ ok: false, error: "Config load failed" }), { status: 500 });
    }

    if (!cfg.enabled) {
      await logRun(supabase, "skipped", cfg.mode, undefined, undefined, { reason: "disabled" });
      return Response.json({ ok: true, skipped: true, reason: "disabled" });
    }

    const now = new Date();
    // Only forward on the configured weekly day/hour (UTC). Cron may still invoke frequently.
    const isWeeklyHour = now.getUTCDay() === cfg.weekly_dow && now.getUTCHours() === cfg.weekly_start_hour_utc;
    if (!isWeeklyHour) {
      await logRun(supabase, "skipped", cfg.mode, undefined, undefined, { reason: "outside_weekly_window" });
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
    let batchCursor: Record<string, number> =
      cfg.batch_cursor && typeof cfg.batch_cursor === "object"
        ? { ...(cfg.batch_cursor as Record<string, number>) }
        : {};

    if (weekKey !== currentWeek) {
      cursor = 0;
      processed = 0;
      weekKey = currentWeek;
      batchCursor = {};
    }

    const dbCategories = await getActiveCategories(supabase);
    const cfgCategories = Array.isArray(cfg.categories)
      ? cfg.categories.map((c) => (c || "").trim()).filter((c) => c.length > 0)
      : [];

    const categories = dbCategories.length > 0 ? dbCategories : cfgCategories;
    if (categories.length === 0) {
      await logRun(supabase, "skipped", cfg.mode, undefined, undefined, { reason: "no_categories" });
      return Response.json({ ok: true, skipped: true, reason: "no_categories" });
    }

    if (processed >= categories.length) {
      await logRun(supabase, "skipped", cfg.mode, undefined, undefined, { reason: "week_completed", currentWeek });
      return Response.json({ ok: true, skipped: true, reason: "week_completed" });
    }

    // Chunked processing settings
    const chunkSize = Number(Deno.env.get("SCHEDULER_CHUNK_SIZE") || "1");
    const perCallDelaySec = Number(Deno.env.get("SCHEDULER_PER_CALL_DELAY") || "0");
    // How many batches (of tools) to include in a single API call for a category
    const batchesPerCall = Number(Deno.env.get("SCHEDULER_BATCHES_PER_CALL") || "1");
    // How many tools are considered one "batch" (used by target to know how many tools per batch)
    const toolsPerBatch = Number(Deno.env.get("SCHEDULER_TOOLS_PER_BATCH") || "4");
    const isSweep = (req.headers.get("x-sweep") || "") === "1";

    // If not a sweep, enforce min_interval; if sweep, bypass min_interval so cron can run every minute
    if (!isSweep && cfg.last_run_at) {
      const last = new Date(cfg.last_run_at).getTime();
      const diffMin = (Date.now() - last) / 60000;
      if (diffMin < cfg.min_interval_minutes) {
        await logRun(supabase, "skipped", cfg.mode, undefined, undefined, { reason: "min_interval", diffMin });
        return Response.json({ ok: true, skipped: true, reason: "min_interval" });
      }
    }

    const targetBase = cfg.mode === "prod"
      ? (Deno.env.get("PROD_BASE_URL") || "")
      : (Deno.env.get("PREVIEW_BASE_URL") || "");

    const targetSecret = cfg.mode === "prod"
      ? (Deno.env.get("PROD_CRON_SECRET") || "")
      : (Deno.env.get("PREVIEW_CRON_SECRET") || "");

    if (!targetBase || !targetSecret) {
      await logRun(supabase, "error", cfg.mode, undefined, undefined, { reason: "missing_target_env" });
      return new Response(JSON.stringify({ ok: false, error: "Missing target env vars" }), { status: 500 });
    }

    const targetUrlBase = `${targetBase.replace(/\/+$/, "")}/api/posts/ai/generate`;

    // Process up to chunkSize category/batch forwards in this invocation
    let forwardsDone = 0;
    let lastResponseStatus = 0;
    let lastReason: string | null = null;

    for (let i = 0; i < chunkSize && processed < categories.length; i++) {
      const idx = cursor % categories.length;
      const category = categories[idx];
      const batchCount = await getCategoryBatchCount(supabase, category);

      if (batchCount <= 0) {
        const nextCursor = (idx + 1) % categories.length;
        const nextProcessed = processed + 1;
        batchCursor[category] = 0;

        await supabase
          .from("ai_scheduler_config")
          .update({
            cursor: nextCursor,
            processed_this_week: nextProcessed,
            week_key: weekKey,
            batch_cursor: batchCursor,
            last_run_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("id", 1);

        await logRun(supabase, "skipped", cfg.mode, category, undefined, {
          reason: "no_active_tools_in_category",
          cursor: nextCursor,
          processed_this_week: nextProcessed,
        });

        cursor = nextCursor;
        processed = nextProcessed;
        forwardsDone++;
        continue;
      }

      const currentBatch = Number(batchCursor[category] || 0);
      const startBatch = Math.min(batchCount, Math.max(1, currentBatch + 1));
      const remainingBatches = batchCount - (startBatch - 1);
      const batchesThisCall = Math.min(remainingBatches, batchesPerCall);

      const forwardRes = await fetch(targetUrlBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": targetSecret,
          "x-trigger-source": "supabase-scheduler",
          "x-sweep": isSweep ? "1" : "0",
        },
        body: JSON.stringify({
          source: "supabase-scheduler",
          mode: batchesThisCall > 1 ? "multi-batch-category" : "single-category",
          category,
          start_batch: startBatch,
          batches: batchesThisCall,
          tools_per_batch: toolsPerBatch,
        }),
      });

      const forwardText = await forwardRes.text();
      lastResponseStatus = forwardRes.status;
      let forwardPayload: Record<string, unknown> | null = null;
      try { forwardPayload = JSON.parse(forwardText); } catch { forwardPayload = null; }

      const skipped = Boolean(forwardPayload && (forwardPayload as { skipped?: unknown }).skipped === true);
      const reasonValue = forwardPayload ? (forwardPayload as { reason?: unknown }).reason : "";
      const reason = typeof reasonValue === "string" ? reasonValue : "";

      const payloadIndicatesError = Boolean(
        forwardPayload && (
          (forwardPayload as any).error === true ||
          (forwardPayload as any).success === false ||
          (forwardPayload as any).ok === false
        )
      );

      const completedSuccessfully = forwardRes.ok && !payloadIndicatesError && !(skipped && reason.toLowerCase() === "generation already in progress");
      const warning = forwardPayload ? (forwardPayload as any).warning : undefined;

      let nextCursor = cursor;
      let nextProcessed = processed;

      if (completedSuccessfully) {
        const lastBatchProcessed = startBatch + batchesThisCall - 1;
        if (lastBatchProcessed >= batchCount) {
          batchCursor[category] = 0;
          nextCursor = (idx + 1) % categories.length;
          nextProcessed = processed + 1;
        } else {
          batchCursor[category] = lastBatchProcessed;
        }
      }

      await supabase
        .from("ai_scheduler_config")
        .update({
          cursor: nextCursor,
          processed_this_week: nextProcessed,
          week_key: weekKey,
          batch_cursor: batchCursor,
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      await logRun(supabase, completedSuccessfully ? "success" : (forwardRes.ok && skipped ? "skipped" : "error"), cfg.mode, category, startBatch, {
        status: forwardRes.status,
        body: forwardText.slice(0, 2000),
        skipped,
        reason,
        warning: warning ?? null,
        completed_successfully: completedSuccessfully,
        batch_start: startBatch,
        batches: batchesThisCall,
        batch_count: batchCount,
        cursor: nextCursor,
        processed_this_week: nextProcessed,
      });

      // advance local cursor/state for next iteration
      cursor = nextCursor;
      processed = nextProcessed;
      forwardsDone++;

      // delay between forwards to avoid rate limits
      if (i < chunkSize - 1 && perCallDelaySec > 0) {
        await new Promise((res) => setTimeout(res, perCallDelaySec * 1000));
      }
    }

    return Response.json({ ok: true, forwards: forwardsDone, last_status: lastResponseStatus, cursor, processed_this_week: processed });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
