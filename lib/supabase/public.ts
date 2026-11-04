import { createClient } from "@supabase/supabase-js";

// Cookie-free client for public pages: sees only what the RLS rules allow anyone to see.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false } },
);
