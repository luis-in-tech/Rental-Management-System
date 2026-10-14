import { supabaseAdmin } from '../config/supabase';

interface KeepAliveState {
  lastPingAt: string | null;
  lastStatus: 'idle' | 'success' | 'error';
  lastDurationMs: number | null;
  totalPings: number;
  successfulPings: number;
  consecutiveFailures: number;
  lastError: string | null;
  intervalHours: number;
  nextScheduledPingAt: string | null;
}

const state: KeepAliveState = {
  lastPingAt: null,
  lastStatus: 'idle',
  lastDurationMs: null,
  totalPings: 0,
  successfulPings: 0,
  consecutiveFailures: 0,
  lastError: null,
  intervalHours: Math.max(1, parseInt(process.env.SUPABASE_KEEPALIVE_INTERVAL_HOURS || '6', 10)),
  nextScheduledPingAt: null,
};

let timer: NodeJS.Timeout | null = null;

/**
 * Pings the Supabase database with a lightweight query to generate active database traffic,
 * preventing project pausing on the Supabase Free Tier (which pauses after 7 days of inactivity).
 */
export async function pingSupabaseDatabase(): Promise<{
  success: boolean;
  status: 'success' | 'error';
  durationMs: number;
  timestamp: string;
  queryTarget: string;
  error?: string;
  dataSnippet?: any;
}> {
  const startTime = Date.now();
  state.totalPings++;
  const timestamp = new Date().toISOString();

  try {
    // Perform a lightweight query against the buildings table
    const { data, error, status } = await supabaseAdmin
      .from('buildings')
      .select('id')
      .limit(1);

    const durationMs = Date.now() - startTime;
    state.lastPingAt = timestamp;
    state.lastDurationMs = durationMs;

    if (error) {
      throw error;
    }

    state.lastStatus = 'success';
    state.successfulPings++;
    state.consecutiveFailures = 0;
    state.lastError = null;

    console.log(
      `[Supabase KeepAlive] ✅ Database ping succeeded in ${durationMs}ms (HTTP ${status}). Project activity refreshed.`
    );

    return {
      success: true,
      status: 'success',
      durationMs,
      timestamp,
      queryTarget: 'buildings.select(id).limit(1)',
      dataSnippet: data,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err?.message || String(err);

    // Attempt fallback query against auth/users or admin_profiles if table query failed
    try {
      const fallbackStart = Date.now();
      const fallbackRes = await supabaseAdmin
        .from('admin_profiles')
        .select('id')
        .limit(1);

      if (!fallbackRes.error) {
        const totalDuration = Date.now() - startTime;
        state.lastPingAt = timestamp;
        state.lastDurationMs = totalDuration;
        state.lastStatus = 'success';
        state.successfulPings++;
        state.consecutiveFailures = 0;
        state.lastError = null;

        console.log(
          `[Supabase KeepAlive] ✅ Fallback ping succeeded in ${Date.now() - fallbackStart}ms. Project activity refreshed.`
        );

        return {
          success: true,
          status: 'success',
          durationMs: totalDuration,
          timestamp,
          queryTarget: 'admin_profiles.select(id).limit(1)',
          dataSnippet: fallbackRes.data,
        };
      }
    } catch {
      // Ignore fallback error and report initial error
    }

    state.lastPingAt = timestamp;
    state.lastDurationMs = durationMs;
    state.lastStatus = 'error';
    state.consecutiveFailures++;
    state.lastError = errorMessage;

    console.error(
      `[Supabase KeepAlive] ❌ Database ping failed after ${durationMs}ms:`,
      errorMessage
    );

    return {
      success: false,
      status: 'error',
      durationMs,
      timestamp,
      queryTarget: 'buildings.select(id).limit(1)',
      error: errorMessage,
    };
  } finally {
    const intervalMs = state.intervalHours * 60 * 60 * 1000;
    state.nextScheduledPingAt = new Date(Date.now() + intervalMs).toISOString();
  }
}

/**
 * Initializes the background keepalive scheduler.
 * Runs an immediate ping upon launch, then recurs at the configured interval.
 */
export function startKeepAliveScheduler(): void {
  if (process.env.DISABLE_SUPABASE_KEEPALIVE === 'true') {
    console.log('[Supabase KeepAlive] Disabled via DISABLE_SUPABASE_KEEPALIVE environment variable.');
    return;
  }

  const intervalHours = state.intervalHours;
  const intervalMs = intervalHours * 60 * 60 * 1000;

  console.log(
    `[Supabase KeepAlive] Initializing automated database caller (Interval: every ${intervalHours}h to prevent free tier auto-pause)...`
  );

  // Initial ping with a 3-second grace period after server start
  setTimeout(async () => {
    try {
      await pingSupabaseDatabase();
    } catch (e) {
      console.error('[Supabase KeepAlive] Initial ping error:', e);
    }
  }, 3000);

  // Clear existing timer if any
  if (timer) {
    clearInterval(timer);
  }

  timer = setInterval(async () => {
    try {
      await pingSupabaseDatabase();
    } catch (e) {
      console.error('[Supabase KeepAlive] Scheduled ping error:', e);
    }
  }, intervalMs);

  // Prevent interval from hanging Node process on exit
  if (timer.unref) {
    timer.unref();
  }

  state.nextScheduledPingAt = new Date(Date.now() + intervalMs).toISOString();
}

/**
 * Returns the current keepalive status and statistics.
 */
export function getKeepAliveStatus(): KeepAliveState {
  return { ...state };
}
