import { notFound, redirect } from "next/navigation";

import { DesignWizard } from "@/components/wizard/design-wizard";
import { mapHouseRequirementsRow, mapPlotRow } from "@/lib/domain/mappers";
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

  // Pre-fetched here (rather than by the client wizard on mount) so a
  // returning user sees their saved draft immediately, with no loading
  // flash — both tables are unique-per-project (SPEC.md §43), so at most
  // one row of each ever exists.
  const [{ data: plotRow }, { data: requirementsRow }] = await Promise.all([
    supabase.from("plots").select("*").eq("project_id", projectId).maybeSingle(),
    supabase.from("house_requirements").select("*").eq("project_id", projectId).maybeSingle(),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">{project.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Status: <span className="uppercase">{project.status}</span>
      </p>

      <div className="mt-8">
        <DesignWizard
          projectId={project.id}
          initialPlot={plotRow ? mapPlotRow(plotRow) : null}
          initialRequirements={requirementsRow ? mapHouseRequirementsRow(requirementsRow) : null}
        />
      </div>
    </main>
  );
}
