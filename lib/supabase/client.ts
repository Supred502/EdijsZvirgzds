import { createBrowserClient } from "@supabase/ssr";

// Browser client for the admin: used to upload images straight to Storage (the storage rules allow only the owner).
export const createClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
