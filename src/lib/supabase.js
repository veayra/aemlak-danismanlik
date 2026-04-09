import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fgfmmjazmhxkgdgtubba.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZm1tamF6bWh4a2dkZ3R1YmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjM4NTMsImV4cCI6MjA5MTMzOTg1M30.OkKSuRueVhT2EG4viSJ-xLpEoES2GpnBS7Fg2UZEX1k'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
