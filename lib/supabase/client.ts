import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components. Reads the public
 * (publishable/anon) key only — never the service role key.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
