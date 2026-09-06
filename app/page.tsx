import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-24 text-center">
      <span className="rounded-full border border-border px-4 py-1 text-xs font-medium text-muted-foreground">
        AI-assisted conceptual design — not a substitute for licensed professionals
      </span>

      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Design Your Dream Home with AI
      </h1>

      <p className="max-w-2xl text-lg text-muted-foreground">
        Enter your plot details, tell us what you need, and get 3 personalized house concepts in
        minutes.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/design">
          <Button size="lg">Start Designing</Button>
        </Link>
        <Link href="#how-it-works">
          <Button size="lg" variant="outline">
            See How It Works
          </Button>
        </Link>
      </div>

      <section id="how-it-works" className="mt-16 grid gap-6 text-left sm:grid-cols-3">
        {[
          {
            title: "1. Tell us about your land",
            body: "Plot dimensions, location, road direction, and orientation.",
          },
          {
            title: "2. Tell us your requirements",
            body: "Bedrooms, bathrooms, parking, budget, style, and optional Vastu preferences.",
          },
          {
            title: "3. Get 3 house concepts",
            body: "Compare floor plans, visuals, and estimated cost — then refine with natural language.",
          },
        ].map((step) => (
          <div key={step.title} className="rounded-lg border border-border p-6">
            <h3 className="mb-2 font-medium">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </section>

      <p className="mt-12 max-w-2xl text-xs text-muted-foreground">
        AI-generated house designs are conceptual and intended for planning and visualization.
        They are not guaranteed to satisfy local building regulations, structural requirements,
        site conditions, or permit requirements. Construction should proceed only after review and
        approval by appropriately qualified professionals and relevant authorities.
      </p>
    </main>
  );
}
