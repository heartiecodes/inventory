import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://kzgwhumsytfpdxnqmcye.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6Z3dodW1zeXRmcGR4bnFtY3llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzE4MzcsImV4cCI6MjA4Nzc0NzgzN30._3HyWn7VVsP6gbHhuAxRWSPRqG6YRAFC_Qa1J6sB_bc";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
