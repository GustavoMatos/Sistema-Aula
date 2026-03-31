import { Request, Response } from 'express'
import { supabase } from '../config/supabase.js'

export async function healthCheck(_req: Request, res: Response) {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
    },
  }

  // Check Supabase connection
  try {
    const { error } = await supabase.from('workspaces').select('id').limit(1)
    checks.services.database = error ? 'error' : 'ok'
  } catch {
    checks.services.database = 'error'
  }

  const allHealthy = Object.values(checks.services).every(s => s === 'ok')
  
  res.status(allHealthy ? 200 : 503).json(checks)
}
