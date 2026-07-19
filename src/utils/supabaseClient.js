/**
 * VendrAI Supabase Client (Singleton)
 */
const { createClient } = require('@supabase/supabase-js');

let supabaseInstance = null;

function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.SUPABASE_SERVICE_KEY || "placeholder"
    );
  }
  return supabaseInstance;
}

module.exports = { getSupabase };
