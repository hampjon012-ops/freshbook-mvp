import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://jfnafabrlumgvpzbfbuf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbmFmYWJybHVtZ3ZwemJmYnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDk3NjYsImV4cCI6MjA4OTU4NTc2Nn0.c3y7C2NtRWVYzzKPApte10sXLhAfTSCoH-x4rmjRx48',
  {
    auth: {
      detectSessionInUrl: true,
      flowType: 'pkce',
    }
  }
)

// Admin client with service_role key — used only for owner actions (invite stylist)
// This is safe for an internal admin tool with restricted access
// NOTE: Ensure Google Cloud Console has redirect URI: https://jfnafabrlumgvpzbfbuf.supabase.co/auth/v1/callback
export const supabaseAdmin = createClient(
  'https://jfnafabrlumgvpzbfbuf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbmFmYWJybHVtZ3ZwemJmYnVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAwOTc2NiwiZXhwIjoyMDg5NTg1NzY2fQ.T6Gxu5mvmXiHa2hgtMYAPrSpejmzOug1ntw9QERgn3E',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)
