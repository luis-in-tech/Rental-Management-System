import { Router, Request, Response } from 'express';
import { getKeepAliveStatus, pingSupabaseDatabase } from '../services/keepalive';
import { supabaseUrl } from '../config/supabase';

const router = Router();

/**
 * GET /api/keepalive
 * Query parameter `?ping=true` or `?trigger=true` will execute a fresh ping immediately.
 * Otherwise returns the cached status and scheduling metrics.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const shouldTrigger = req.query.ping === 'true' || req.query.trigger === 'true';

  let pingResult = null;
  if (shouldTrigger) {
    pingResult = await pingSupabaseDatabase();
  }

  const status = getKeepAliveStatus();
  const sanitizedUrl = supabaseUrl ? supabaseUrl.replace(/^(https?:\/\/)([^.]+)(.*)/, '$1$2$3') : 'Not Configured';

  res.json({
    service: 'RentaHub Supabase KeepAlive Caller',
    description: 'Keeps Supabase free-tier project active to prevent 7-day auto-pause',
    targetDatabaseHost: sanitizedUrl,
    triggeredLivePing: shouldTrigger,
    livePingResult: pingResult,
    stats: status,
    serverUptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/keepalive
 * Triggers an immediate ping to the Supabase database.
 */
router.post('/', async (_req: Request, res: Response): Promise<void> => {
  const pingResult = await pingSupabaseDatabase();
  const status = getKeepAliveStatus();

  res.status(pingResult.success ? 200 : 502).json({
    message: pingResult.success ? 'Keepalive database ping succeeded' : 'Keepalive database ping failed',
    result: pingResult,
    stats: status,
  });
});

export default router;
