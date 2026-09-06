"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DesignEntryPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createDraftProject() {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Project" }),
      });

      if (res.status === 401) {
        router.replace("/login?next=/design");
        return;
      }

      if (!res.ok) {
        setError("We couldn't start a new design. Please try again.");
        return;
      }

      const { project } = await res.json();
      router.replace(`/design/${project.id}`);
    }

    void createDraftProject();
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Starting your project…</p>
      )}
    </main>
  );
}
