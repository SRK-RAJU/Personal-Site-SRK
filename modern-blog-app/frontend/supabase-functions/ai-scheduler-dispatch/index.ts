// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * ai-scheduler-dispatch
 *
 * pg_cron calls this function on a short interval (see supabase-functions/schedule_ai_scheduler.sql).
 * Every call forwards AT MOST ONE category batch (4 tools) to /api/posts/ai/generate, so one weekly
 * "sweep" is spread over many calls:
 *
 *   - A sweep (cycle) starts at ai_scheduler_config.weekly_dow / weekly_start_hour_utc (UTC). A new sweep can
 *     only start during the first SCHEDULER_START_WINDOW_HOURS (default 24) after that moment.
 *   - Ticks keep working through every active category and every batch until all of them are done, even if that
 *     takes longer than the start window. Finished sweeps stay idle until the next weekly start.
 *   - Progress lives in ai_scheduler_config.batch_cursor ({ "<category>": <batches completed> }).
 *   - A failed batch is retried on the next tick (SCHEDULER_MAX_ATTEMPTS, default 3) and then skipped,
 *     so a single bad batch can never block the remaining categories.
 *   - Idle ticks (disabled / too early / finished) are not written to ai_scheduler_runs.
 */

type ConfigRow = {
  id: number;
  enabled: boolean;
  mode: "preview" | "prod";
  min_interval_minutes: number;
  weekly_dow: number;
  weekly_start_hour_utc: number;
  cursor: number;
  week_key: string;
  processed_this_week: number;
  batch_cursor?: Record<string, number> | null;
  last_run_at: string | null;
};

type Catalog = {
  categories: string[];
  batchCounts: Record<string, number>;
  totalTools: number;
  totalBatches: number;
};

type Work = { category: string; startBatch: number; batchCount: number };

type Outcome = "success" | "no_tools" | "busy" | "failed";

// batch_cursor also stores "<category>::attempts" counters for the batch that is currently failing.
const ATTEMPTS_SUFFIX = "::attempts";
// The generator never serves more than 4 tools per batch, so a larger value would silently skip tools.
const MAX_TOOLS_PER_BATCH = 4;

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function envNumber(name: string, fallback: number, min: number, max: number): number {
  const raw = (Deno.env.get(name) || "").trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Most recent occurrence (<= now) of weeklyDow at weeklyHourUtc:00 UTC. */
function getWeeklyStartUtc(now: Date, weeklyDow: number, weeklyHourUtc: number): Date {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const delta = (start.getUTCDay() - weeklyDow + 7) % 7;
  start.setUTCDate(start.getUTCDate() - delta);
  start.setUTCHours(weeklyHourUtc, 0, 0, 0);

  if (start.getTime() > now.getTime()) {
    start.setUTCDate(start.getUTCDate() - 7);
  }

  return start;
}

// One sweep = one weekly start. Using the start moment (not a Sunday based week number) keeps the
// state reset aligned with the configured weekly day/hour.
function cycleKeyFor(weeklyStart: Date): string {
  return weeklyStart.toISOString().slice(0, 16);
}

async function logRun(
  supabase: any,
  status: string,
  mode?: string,
  category?: string,
  batch?: number,
  details?: Record<string, unknown>
) {
  try {
    const { error } = await supabase.from("ai_scheduler_runs").insert({
      status,
      mode: mode ?? null,
      category: category ?? null,
      batch: batch ?? null,
      details: details ?? null,
    });
    if (error) console.error("[scheduler] log insert failed:", error.message);
  } catch (err) {
    console.error("[scheduler] log insert failed:", String(err));
  }
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

/**
 * Reads every active tool once and derives the category list plus the number of batches per category.
 * Pages through the table (PostgREST caps a response at 1000 rows) and throws on any query error so a
 * transient database problem can never make categories look empty and get skipped.
 */
async function loadCatalog(supabase: any, toolsPerBatch: number): Promise<Catalog> {
  const pageSize = 1000;
  // Keyed case-insensitively because the generator matches categories with ilike.
  const byKey = new Map<string, { name: string; tools: number }>();

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("tools_coverage_metadata")
      .select("id, category")
      .eq("is_active", true)
      .not("category", "is", null)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`catalog_query_failed: ${error.message}`);
    }

    const rows = (data ?? []) as Array<{ category?: string | null }>;
    for (const row of rows) {
      const name = String(row.category || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const entry = byKey.get(key);
      if (entry) {
        entry.tools += 1;
      } else {
        byKey.set(key, { name, tools: 1 });
      }
    }

    if (rows.length < pageSize) break;
  }

  const entries = Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
  const batchCounts: Record<string, number> = {};
  let totalTools = 0;
  let totalBatches = 0;

  for (const entry of entries) {
    const batches = Math.max(1, Math.ceil(entry.tools / toolsPerBatch));
    batchCounts[entry.name] = batches;
    totalTools += entry.tools;
    totalBatches += batches;
  }

  return { categories: entries.map((entry) => entry.name), batchCounts, totalTools, totalBatches };
}

function completedBatchesFor(batchCursor: Record<string, number>, category: string, total: number): number {
  const done = Math.floor(Number(batchCursor[category]) || 0);
  return Math.min(total, Math.max(0, done));
}

/** First category (alphabetical) that still has unfinished batches, or null when the sweep is done. */
function nextWork(catalog: Catalog, batchCursor: Record<string, number>): Work | null {
  for (const category of catalog.categories) {
    const total = catalog.batchCounts[category];
    const done = completedBatchesFor(batchCursor, category, total);
    if (done < total) {
      return { category, startBatch: done + 1, batchCount: total };
    }
  }
  return null;
}

function summarize(catalog: Catalog, batchCursor: Record<string, number>) {
  let completedCategories = 0;
  let completedBatches = 0;
  let nextIndex = catalog.categories.length;

  catalog.categories.forEach((category, index) => {
    const total = catalog.batchCounts[category];
    const done = completedBatchesFor(batchCursor, category, total);
    completedBatches += done;
    if (done >= total) {
      completedCategories += 1;
    } else if (nextIndex === catalog.categories.length) {
      nextIndex = index;
    }
  });

  return { completedCategories, completedBatches, nextIndex };
}

/**
 * Records this tick as "last run" before the slow generator call. The update only applies when
 * last_run_at is still what we read, so two overlapping cron jobs cannot forward the same batch twice.
 */
async function claimTick(supabase: any, previousLastRunAt: string | null, patch: Record<string, unknown>): Promise<boolean> {
  let query = supabase.from("ai_scheduler_config").update(patch).eq("id", 1);
  query = previousLastRunAt === null ? query.is("last_run_at", null) : query.eq("last_run_at", previousLastRunAt);

  const { data, error } = await query.select("id");
  if (error) throw new Error(`claim_failed: ${error.message}`);
  if ((data?.length ?? 0) > 0) return true;

  // Nothing matched: either another tick claimed it first, or the timestamp text did not round-trip.
  // Re-read to tell them apart so a formatting quirk can never stall the scheduler.
  const { data: fresh, error: freshErr } = await supabase
    .from("ai_scheduler_config")
    .select("last_run_at")
    .eq("id", 1)
    .single();
  if (freshErr) throw new Error(`claim_recheck_failed: ${freshErr.message}`);

  if ((fresh?.last_run_at ?? null) === previousLastRunAt) {
    const { error: forceErr } = await supabase.from("ai_scheduler_config").update(patch).eq("id", 1);
    if (forceErr) throw new Error(`claim_failed: ${forceErr.message}`);
    return true;
  }

  return false;
}

async function forwardBatch(
  url: string,
  secret: string,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<{ ok: boolean; status: number; text: string; networkError: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      // A protected/redirecting deployment would otherwise answer 200 with an HTML login page.
      redirect: "manual",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": secret,
        "x-trigger-source": "supabase-scheduler",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text, networkError: null };
  } catch (err) {
    const aborted = (err as { name?: string })?.name === "AbortError";
    return {
      ok: false,
      status: 0,
      text: "",
      networkError: aborted ? `timeout_after_${timeoutMs}ms` : String((err as Error)?.message || err),
    };
  } finally {
    clearTimeout(timer);
  }
}

function classify(res: { ok: boolean; status: number; text: string; networkError: string | null }) {
  let payload: Record<string, any> | null = null;
  try {
    const parsed = JSON.parse(res.text);
    payload = parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    payload = null;
  }

  const reasonText = payload && typeof payload.reason === "string" ? payload.reason : "";
  const reason = reasonText.toLowerCase();
  const skipped = payload?.skipped === true;
  const warning = payload?.warning ?? null;
  const postsSaved = typeof payload?.posts_saved === "number" ? payload.posts_saved : null;

  const result = (outcome: Outcome, why: string) => ({ outcome, reason: why, skipped, warning, postsSaved });

  if (res.networkError) return result("failed", res.networkError);
  if (res.ok && skipped && reason.includes("already in progress")) return result("busy", reasonText);
  if (res.ok && skipped && reason.includes("no tools found")) return result("no_tools", reasonText);

  const payloadError = payload && (payload.success === false || payload.ok === false || Boolean(payload.error));
  if (!res.ok || payloadError) {
    const detail = payload ? String(payload.message || payload.error || reasonText || "") : "";
    return result("failed", detail ? `http_${res.status}: ${detail}` : `http_${res.status}`);
  }
  if (!payload) return result("failed", "non_json_response");
  if (skipped) return result("failed", reasonText || "skipped_by_generator");
  if (postsSaved === null || postsSaved <= 0) return result("failed", "no_post_saved");

  return result("success", "");
}

serve(async (req) => {
  const startedAt = Date.now();
  let supabase: any = null;

  try {
    const inboundSecret = req.headers.get("x-supa-cron-secret") || "";
    const expectedInbound = Deno.env.get("CRON_TO_FUNCTION_SECRET") || "";
    if (!expectedInbound || inboundSecret !== expectedInbound) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRole = getServiceRoleKey();
    if (!supabaseUrl || !serviceRole) {
      return json({ ok: false, error: "Missing Supabase env" }, 500);
    }

    supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const dryRun = (req.headers.get("x-dry-run") || "") === "1";

    const { data: cfgData, error: cfgErr } = await supabase
      .from("ai_scheduler_config")
      .select("*")
      .eq("id", 1)
      .single();

    const cfg = (cfgData ?? null) as ConfigRow | null;
    if (cfgErr || !cfg) {
      await logRun(supabase, "error", undefined, undefined, undefined, { step: "load_config", message: cfgErr?.message });
      return json({ ok: false, error: "Config load failed" }, 500);
    }

    const now = new Date();
    const weeklyStart = getWeeklyStartUtc(now, Number(cfg.weekly_dow), Number(cfg.weekly_start_hour_utc));
    const currentCycle = cycleKeyFor(weeklyStart);
    const isNewCycle = (cfg.week_key || "") !== currentCycle;

    // Gates that make a tick a silent no-op.
    const minIntervalSec = Math.max(0, Number(cfg.min_interval_minutes) || 0) * 60;
    const graceSec = envNumber("SCHEDULER_INTERVAL_GRACE_SECONDS", 20, 0, 60);
    const startWindowHours = envNumber("SCHEDULER_START_WINDOW_HOURS", 24, 1, 168);
    const sinceLastRunSec = cfg.last_run_at ? (now.getTime() - new Date(cfg.last_run_at).getTime()) / 1000 : Infinity;
    const hoursSinceWeeklyStart = (now.getTime() - weeklyStart.getTime()) / 3600000;

    let idleReason: string | null = null;
    if (!cfg.enabled) {
      idleReason = "disabled";
    } else if (isNewCycle && hoursSinceWeeklyStart >= startWindowHours) {
      // A sweep only starts shortly after the weekly start. This stops a blank/legacy week_key (fresh install,
      // manual reset) from kicking off a sweep at a random time, right before the real weekly start restarts it.
      // A sweep that is already in progress keeps going regardless of this window.
      idleReason = "waiting_for_weekly_start";
    } else if (sinceLastRunSec < minIntervalSec - graceSec) {
      // The grace absorbs cron jitter so a 2 minute cron and a 2 minute interval do not skip every other tick.
      idleReason = "min_interval";
    }

    if (idleReason && !dryRun) {
      return json({ ok: true, skipped: true, reason: idleReason });
    }

    const toolsPerBatch = envNumber("SCHEDULER_TOOLS_PER_BATCH", MAX_TOOLS_PER_BATCH, 1, MAX_TOOLS_PER_BATCH);
    const catalog = await loadCatalog(supabase, toolsPerBatch);

    if (catalog.categories.length === 0) {
      if (dryRun) return json({ ok: true, dry_run: true, reason: "no_categories" });
      await logRun(supabase, "skipped", cfg.mode, undefined, undefined, { reason: "no_categories" });
      return json({ ok: true, skipped: true, reason: "no_categories" });
    }

    let batchCursor: Record<string, number> =
      !isNewCycle && cfg.batch_cursor && typeof cfg.batch_cursor === "object" ? { ...cfg.batch_cursor } : {};
    let work = nextWork(catalog, batchCursor);

    if (dryRun) {
      const progress = summarize(catalog, batchCursor);
      return json({
        ok: true,
        dry_run: true,
        enabled: cfg.enabled,
        mode: cfg.mode,
        cycle: currentCycle,
        new_cycle: isNewCycle,
        idle_reason: idleReason,
        hours_since_weekly_start: Math.round(hoursSinceWeeklyStart * 10) / 10,
        categories: catalog.categories.length,
        total_tools: catalog.totalTools,
        total_batches: catalog.totalBatches,
        completed_batches: progress.completedBatches,
        next: work,
        seconds_since_last_run: Number.isFinite(sinceLastRunSec) ? Math.round(sinceLastRunSec) : null,
        min_interval_minutes: cfg.min_interval_minutes,
      });
    }

    if (!work) {
      return json({ ok: true, skipped: true, reason: "week_completed", cycle: currentCycle });
    }

    const targetBase = cfg.mode === "prod"
      ? (Deno.env.get("PROD_BASE_URL") || "")
      : (Deno.env.get("PREVIEW_BASE_URL") || "");
    const targetSecret = cfg.mode === "prod"
      ? (Deno.env.get("PROD_CRON_SECRET") || "")
      : (Deno.env.get("PREVIEW_CRON_SECRET") || "");

    if (!targetBase || !targetSecret) {
      await logRun(supabase, "error", cfg.mode, undefined, undefined, { reason: "missing_target_env" });
      return json({ ok: false, error: "Missing target env vars" }, 500);
    }

    const targetUrl = `${targetBase.replace(/\/+$/, "")}/api/posts/ai/generate`;

    const chunkSize = envNumber("SCHEDULER_CHUNK_SIZE", 1, 1, 5);
    const batchesPerCall = envNumber("SCHEDULER_BATCHES_PER_CALL", 1, 1, 4);
    const perCallDelaySec = envNumber("SCHEDULER_PER_CALL_DELAY", 0, 0, 60);
    const maxAttempts = envNumber("SCHEDULER_MAX_ATTEMPTS", 3, 1, 10);
    const forwardTimeoutMs = envNumber("SCHEDULER_FORWARD_TIMEOUT_MS", 75000, 5000, 140000);
    // Supabase stops an invocation that runs past its wall-clock limit, so never start a forward that cannot finish.
    const invocationBudgetMs = 140000;

    const claimIso = new Date().toISOString();
    const claimPatch: Record<string, unknown> = { last_run_at: claimIso, updated_at: claimIso };
    if (isNewCycle) {
      Object.assign(claimPatch, { week_key: currentCycle, batch_cursor: {}, cursor: 0, processed_this_week: 0 });
    }

    const claimed = await claimTick(supabase, cfg.last_run_at ?? null, claimPatch);
    if (!claimed) {
      return json({ ok: true, skipped: true, reason: "claimed_by_another_tick" });
    }

    if (isNewCycle) {
      await logRun(supabase, "started", cfg.mode, undefined, undefined, {
        cycle: currentCycle,
        categories: catalog.categories.length,
        total_tools: catalog.totalTools,
        total_batches: catalog.totalBatches,
      });
    }

    let forwards = 0;
    let lastStatus = 0;

    while (work && forwards < chunkSize) {
      if (forwards > 0) {
        if (Date.now() - startedAt + forwardTimeoutMs > invocationBudgetMs) break;
        if (perCallDelaySec > 0) await sleep(perCallDelaySec * 1000);
        await supabase.from("ai_scheduler_config").update({ last_run_at: new Date().toISOString() }).eq("id", 1);
      }

      const batchesThisCall = Math.min(work.batchCount - (work.startBatch - 1), batchesPerCall);
      const lastBatchProcessed = work.startBatch + batchesThisCall - 1;

      const forwardRes = await forwardBatch(
        targetUrl,
        targetSecret,
        {
          source: "supabase-scheduler",
          mode: batchesThisCall > 1 ? "multi-batch-category" : "single-category",
          category: work.category,
          start_batch: work.startBatch,
          batches: batchesThisCall,
          tools_per_batch: toolsPerBatch,
        },
        forwardTimeoutMs
      );
      const verdict = classify(forwardRes);
      lastStatus = forwardRes.status;

      const attemptsKey = `${work.category}${ATTEMPTS_SUFFIX}`;
      let attempt = 0;
      let gaveUp = false;

      if (verdict.outcome === "success") {
        batchCursor[work.category] = lastBatchProcessed;
        delete batchCursor[attemptsKey];
      } else if (verdict.outcome === "no_tools") {
        batchCursor[work.category] = work.batchCount;
        delete batchCursor[attemptsKey];
      } else if (verdict.outcome === "failed") {
        attempt = Math.floor(Number(batchCursor[attemptsKey]) || 0) + 1;
        if (attempt >= maxAttempts) {
          gaveUp = true;
          batchCursor[work.category] = lastBatchProcessed;
          delete batchCursor[attemptsKey];
        } else {
          batchCursor[attemptsKey] = attempt;
        }
      }
      // "busy" keeps the state untouched; the generator's lock expires on its own and the next tick retries.

      const progress = summarize(catalog, batchCursor);
      const { error: stateErr } = await supabase
        .from("ai_scheduler_config")
        .update({
          cursor: progress.nextIndex,
          processed_this_week: progress.completedCategories,
          batch_cursor: batchCursor,
          week_key: currentCycle,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (stateErr) throw new Error(`state_update_failed: ${stateErr.message}`);

      const status = verdict.outcome === "success"
        ? "success"
        : verdict.outcome === "failed"
          ? "error"
          : "skipped";

      const details = {
        outcome: verdict.outcome,
        reason: verdict.reason,
        http_status: forwardRes.status,
        body: forwardRes.text.slice(0, 1500),
        skipped: verdict.skipped,
        warning: verdict.warning,
        posts_saved: verdict.postsSaved,
        batch_start: work.startBatch,
        batches: batchesThisCall,
        batch_count: work.batchCount,
        attempt: verdict.outcome === "failed" ? attempt : null,
        max_attempts: maxAttempts,
        gave_up: gaveUp,
        cycle: currentCycle,
        cursor: progress.nextIndex,
        processed_this_week: progress.completedCategories,
        total_categories: catalog.categories.length,
        completed_batches: progress.completedBatches,
        total_batches: catalog.totalBatches,
      };

      await logRun(supabase, status, cfg.mode, work.category, work.startBatch, details);
      console.log(JSON.stringify({ scheduler: "forward", category: work.category, batch: work.startBatch, ...details, body: undefined }));

      forwards += 1;

      const finished = progress.completedCategories >= catalog.categories.length;
      if (finished) {
        await logRun(supabase, "completed", cfg.mode, undefined, undefined, {
          cycle: currentCycle,
          categories: catalog.categories.length,
          total_batches: catalog.totalBatches,
        });
      }

      // Retry/backoff is the cron cadence itself: never hammer a failing or busy generator inside one invocation.
      if (verdict.outcome === "busy" || (verdict.outcome === "failed" && !gaveUp)) break;

      work = nextWork(catalog, batchCursor);
    }

    const finalProgress = summarize(catalog, batchCursor);
    return json({
      ok: true,
      forwards,
      last_status: lastStatus,
      cycle: currentCycle,
      cursor: finalProgress.nextIndex,
      processed_this_week: finalProgress.completedCategories,
      total_categories: catalog.categories.length,
      completed_batches: finalProgress.completedBatches,
      total_batches: catalog.totalBatches,
    });
  } catch (e) {
    console.error("[scheduler] fatal:", String(e));
    if (supabase) {
      await logRun(supabase, "error", undefined, undefined, undefined, { step: "dispatch", message: String(e) });
    }
    return json({ ok: false, error: String(e) }, 500);
  }
});
