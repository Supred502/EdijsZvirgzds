import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Call at the top of every admin page and server action. The database rules (RLS) are the final guard.
export async function requireUser() {
  // Admin pages are never prerendered: the session check reads the clock (token expiry) and per-request ids follow.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");
  if (data.claims.aal !== "aal2") redirect("/admin/2fa"); // 2FA code not entered yet
  return supabase;
}
