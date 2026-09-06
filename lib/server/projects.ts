import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Loads a project only if it belongs to `userId`.
 *
 * SPEC.md §42 forbids trusting a `projectId` from the URL alone. RLS also
 * enforces this at the database layer, but the explicit `user_id` filter
 * here is defense in depth and lets callers 404 instead of leaking whether
 * a project exists at all.
 */
export async function getOwnedProject(
  supabase: SupabaseServerClient,
  userId: string,
  projectId: string,
) {
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  return project;
}
