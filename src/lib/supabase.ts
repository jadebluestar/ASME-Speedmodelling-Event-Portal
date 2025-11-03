import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabase) return supabase;

  // Use environment variables or fallback to hardcoded values from old project
  const url = import.meta.env.VITE_SUPABASE_URL || "https://lgulbvojlfnlxgxvwtio.supabase.co";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndWxidm9qbGZubHhneHZ3dGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzODY2NDEsImV4cCI6MjA3Njk2MjY0MX0.p0EFVcpDNK4lFMv_ZDbYKs6rICaH4fQXc9fOqQM951E";

  supabase = createClient(url, anonKey, {
    realtime: { params: { eventsPerSecond: 10 } },
  });

  return supabase;
}
