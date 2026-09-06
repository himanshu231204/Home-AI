import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/domain/types";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Projects</h1>
        <Link href="/design">
          <Button>New Project</Button>
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600">Could not load your projects. Please try again.</p>
      )}

      {!error && projects && projects.length === 0 && (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t started a design yet.{" "}
          <Link href="/design" className="underline">
            Start your first one
          </Link>
          .
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {projects?.map((project: Project & Record<string, unknown>) => (
          <Card key={project.id}>
            <h2 className="font-medium">{project.name}</h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
              {project.status}
            </p>
            <Link href={`/design/${project.id}`}>
              <Button variant="outline" size="sm" className="mt-4">
                Open Project
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </main>
  );
}
