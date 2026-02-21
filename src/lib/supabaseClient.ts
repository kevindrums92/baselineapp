import { createClient } from "@supabase/supabase-js";
import { ENV } from "@/config/env";

export const supabase = createClient(ENV.supabase.url, ENV.supabase.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
