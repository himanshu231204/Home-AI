import { NextResponse } from "next/server";

import { mapHouseRequirementsRow } from "@/lib/domain/mappers";
import { houseRequirementsInputSchema } from "@/lib/domain/schemas";
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
    .from("house_requirements")
    .select("*")
    .eq("project_id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load house requirements", error);
    return NextResponse.json({ error: "Could not load requirements" }, { status: 500 });
  }

  return NextResponse.json({ requirements: row ? mapHouseRequirementsRow(row) : null });
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
  const parsed = houseRequirementsInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid requirements data", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // `house_requirements` has a unique constraint on project_id (one
  // requirements record per project), so this upsert saves both the
  // wizard's first step-by-step draft and every later edit.
  const { data: row, error } = await supabase
    .from("house_requirements")
    .upsert(
      {
        project_id: id,
        floors: input.floors,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        kitchens: input.kitchens,
        parking_cars: input.parkingCars,
        living_rooms: input.livingRooms,
        dining_rooms: input.diningRooms,
        puja_room: input.pujaRoom,
        home_office: input.homeOffice,
        balcony: input.balcony,
        terrace: input.terrace,
        utility_room: input.utilityRoom,
        store_room: input.storeRoom,
        laundry_room: input.laundryRoom,
        vastu_enabled: input.vastuEnabled,
        design_priorities: input.designPriorities,
        architectural_style: input.architecturalStyle,
        construction_quality: input.constructionQuality,
        budget_min: input.budgetMin ?? null,
        budget_max: input.budgetMax ?? null,
        currency: input.currency,
        additional_requirements: input.additionalRequirements,
      },
      { onConflict: "project_id" },
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to save house requirements", error);
    return NextResponse.json({ error: "Could not save requirements" }, { status: 500 });
  }

  return NextResponse.json({ requirements: mapHouseRequirementsRow(row) });
}
