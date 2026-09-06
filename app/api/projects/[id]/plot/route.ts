import { NextResponse } from "next/server";

import { mapPlotRow } from "@/lib/domain/mappers";
import { plotInputSchema } from "@/lib/domain/schemas";
import { getOwnedProject } from "@/lib/server/projects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getOwnedProject(supabase, user.id, id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: row, error } = await supabase
    .from("plots")
    .select("*")
    .eq("project_id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load plot", error);
    return NextResponse.json({ error: "Could not load plot" }, { status: 500 });
  }

  return NextResponse.json({ plot: row ? mapPlotRow(row) : null });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getOwnedProject(supabase, user.id, id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = plotInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid plot data", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // `plots` has a unique constraint on project_id (SPEC.md §9 — one plot per
  // project), so this upsert both creates the wizard's first save and
  // overwrites it on every subsequent edit.
  const { data: row, error } = await supabase
    .from("plots")
    .upsert(
      {
        project_id: id,
        width_mm: input.widthMm,
        length_mm: input.lengthMm,
        road_side: input.roadSide,
        north_direction_degrees: input.northDirectionDegrees,
        location_country: input.locationCountry,
        location_state: input.locationState ?? null,
        location_city: input.locationCity ?? null,
        postal_code: input.postalCode ?? null,
        plot_shape: input.plotShape,
      },
      { onConflict: "project_id" },
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to save plot", error);
    return NextResponse.json({ error: "Could not save plot" }, { status: 500 });
  }

  return NextResponse.json({ plot: mapPlotRow(row) });
}
