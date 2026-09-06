import { NextResponse } from "next/server";

import { updateProjectSchema } from "@/lib/domain/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getOwnedProject(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  projectId: string,
) {
  // Explicit ownership check: SPEC.md §42 forbids trusting `projectId` from
  // the URL alone. We compare against the authenticated user's id even
  // though RLS also enforces this at the database layer — defense in depth.
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  return project;
}

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

  // Never reveal whether a project exists if it belongs to someone else —
  // same 404 either way (SPEC.md §42).
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getOwnedProject(supabase, user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = updateProjectSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid update data", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: project, error } = await supabase
    .from("projects")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update project", error);
    return NextResponse.json({ error: "Could not update project" }, { status: 500 });
  }

  return NextResponse.json({ project });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getOwnedProject(supabase, user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete project", error);
    return NextResponse.json({ error: "Could not delete project" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
