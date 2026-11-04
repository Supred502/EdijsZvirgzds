import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the admin login cookie and sends visitors to the login or 2FA page until both are done.
// Only a first check: pages and actions check again with requireUser().
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list, headers) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  // Redirects keep any refreshed login cookies, otherwise the next request would use a spent refresh token
  const go = (to: string) => {
    const r = NextResponse.redirect(new URL(to, request.url));
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (!data?.claims) return path === "/admin/login" ? response : go("/admin/login");
  if (data.claims.aal !== "aal2") return path === "/admin/2fa" ? response : go("/admin/2fa"); // password ok, code still needed
  if (path === "/admin/login" || path === "/admin/2fa") return go("/admin");
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
