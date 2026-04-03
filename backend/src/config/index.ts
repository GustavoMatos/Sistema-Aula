import 'dotenv/config'
import { z } from 'zod'

// Helper for optional URL that can be empty string or undefined
const optionalUrl = z.string().optional().transform(val => val || undefined).pipe(z.string().url().optional())
const optionalString = z.string().optional().transform(val => val || undefined).pipe(z.string().min(1).optional())

// Environment schema with validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),

  // Supabase - required in production
  SUPABASE_URL: optionalUrl,
  SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_KEY: optionalString,

  // Evolution API - required in production
  EVOLUTION_API_URL: optionalUrl,
  EVOLUTION_API_KEY: optionalString,

  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Webhook (production)
  WEBHOOK_BASE_URL: optionalUrl,
})

// Parse and validate
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.format())
  process.exit(1)
}

const env = parsed.data

// Warn about missing optional vars in development
if (env.NODE_ENV === 'development') {
  const warnings: string[] = []

  if (!env.SUPABASE_URL) warnings.push('SUPABASE_URL')
  if (!env.SUPABASE_SERVICE_KEY) warnings.push('SUPABASE_SERVICE_KEY')
  if (!env.EVOLUTION_API_URL) warnings.push('EVOLUTION_API_URL')
  if (!env.EVOLUTION_API_KEY) warnings.push('EVOLUTION_API_KEY')

  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables:', warnings.join(', '))
    console.warn('   Some features may not work. See .env.example for reference.')
  }
}

// In production, require critical vars
if (env.NODE_ENV === 'production') {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'] as const
  const missing = required.filter(key => !env[key])

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables for production:', missing.join(', '))
    process.exit(1)
  }
}

export const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT, 10),

  supabase: {
    url: env.SUPABASE_URL || '',
    anonKey: env.SUPABASE_ANON_KEY || '',
    serviceKey: env.SUPABASE_SERVICE_KEY || '',
  },

  evolution: {
    url: env.EVOLUTION_API_URL || '',
    apiKey: env.EVOLUTION_API_KEY || '',
  },

  frontendUrl: env.FRONTEND_URL,
  webhookBaseUrl: env.WEBHOOK_BASE_URL || '',
}
