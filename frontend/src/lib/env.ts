// Environment variables validation
// Validates required env vars on app startup

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_API_URL',
] as const

function validateEnvVars(): void {
  const missing: string[] = []

  for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
      missing.push(envVar)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\n` +
      `Please create a .env file based on .env.example`
    )
  }
}

// Validate on module load
validateEnvVars()

// Export typed env object
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  apiUrl: import.meta.env.VITE_API_URL as string,
} as const

// Type for env
export type Env = typeof env
