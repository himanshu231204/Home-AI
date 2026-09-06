import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DesignWizardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/design/${projectId}`);
  }

  // RLS enforces that this only returns a row if the project belongs to the
  // authenticated (or guest/anonymous) user — see supabase/migrations.
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, status")
    .eq("id", projectId)
    .single();

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">{project.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Status: <span className="uppercase">{project.status}</span>
      </p>

      <div className="mt-8 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        The full design wizard (plot, family, rooms, budget, style, and Vastu preferences per
        SPEC.md §38) is implemented in Phase 2. This project record already exists and is
        authorization-scoped to your account — the foundation this wizard will build on.
      </div>
    </main>
  );
}
