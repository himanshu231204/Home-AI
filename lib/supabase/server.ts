import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components, Route Handlers, and Server
 * Actions. Uses the request's cookies to resolve the authenticated (or
 * anonymous guest) session, so Postgres RLS policies apply correctly.
 *
 * Never construct a client with the service-role key in request-scoped
 * code — that would bypass row-level security and break the per-user
 * authorization model required by SPEC.md §13/§42/§56.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component where cookies can't be
            // written; the middleware handles session refresh instead.
          }
        },
      },
    },
  );
}
