import { NextResponse } from "next/server";

import { createProjectSchema } from "@/lib/domain/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS (see supabase/migrations/0001_init.sql) already restricts this to
  // rows owned by the authenticated user, but we never rely on RLS alone —
  // the query is inherently scoped by the server-side session, not a
  // client-supplied id (SPEC.md §42).
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to list projects", error);
    return NextResponse.json({ error: "Could not load projects" }, { status: 500 });
  }

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project data", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, name: parsed.data.name, status: "DRAFT" })
    .select()
    .single();

  if (error) {
    console.error("Failed to create project", error);
    return NextResponse.json({ error: "Could not create project" }, { status: 500 });
  }

  return NextResponse.json({ project }, { status: 201 });
}
