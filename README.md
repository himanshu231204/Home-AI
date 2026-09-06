# AI House Designer

AI-assisted conceptual house design platform. See [`SPEC.md`](./SPEC.md) for the full product
specification — this README covers only what's needed to run what exists today.

> **Status: Phase 1 — Foundation.** Auth, project persistence, and the domain/config layer are
> real and working end-to-end. The geometry engine, AI pipeline, cost engine, rendering, and
> payments described in `SPEC.md` are **not yet implemented** — see "What's implemented" below.

## Stack

- **Frontend/API**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database/Auth**: Supabase (Postgres + Auth), accessed via Row Level Security — the app never
  uses the service-role key in request-scoped code
- **Validation**: Zod schemas for every value that crosses a trust boundary

This deviates from `SPEC.md` §5's suggested dual-runtime (Next.js + separate FastAPI service):
for the Phase 1 MVP we're using a single TypeScript runtime (Next.js Route Handlers as the API
layer) to keep the deployable surface simple on Vercel. If/when the geometry engine needs
Python-specific libraries, a separate FastAPI service can be introduced without touching this
layer — the domain types and API contracts are already framework-agnostic.

## What's implemented (Phase 1)

- Supabase project (Postgres + Auth) provisioned, migrated, RLS-enabled
- `projects`, `plots`, `house_requirements` tables with ownership-scoped RLS policies
- Auth: email/password, Google OAuth, and anonymous **guest sessions** (`supabase.auth.signInAnonymously`)
- Domain types (`lib/domain/types.ts`) mirroring SPEC.md §9-14 (Project, Plot, HouseRequirements,
  HouseModel, Floor, Room, DesignOperation, etc.)
- Zod validation schemas (`lib/domain/schemas.ts`) for API input and the AI design-operation
  contract (SPEC.md §24)
- Room constraint + scoring-weight configuration (`lib/config/room-constraints.ts`) — SPEC.md §15
  explicitly requires these live in config, not hard-coded in the geometry engine
- `POST/GET /api/projects`, `GET/PATCH/DELETE /api/projects/[id]` with explicit
  server-side ownership checks (never trusting a client-supplied `projectId` alone, per SPEC.md §42)
- Homepage, login/signup, dashboard, and a project-scoped placeholder page proving the
  auth → API → DB path works end-to-end

## What's explicitly NOT implemented yet

- The geometry/constraint engine (SPEC.md §17-19, §75) — no `HouseModel` is ever generated yet
- The multi-step design wizard (SPEC.md §38) — `/design` currently only creates a bare project row
- `AIProvider` / `ImageGenerationProvider` abstractions and any LLM integration
- Cost engine, floor-plan rendering, 3D visualization, PDF export
- Payments/entitlements (Razorpay)

Do not treat anything above as implemented — this list exists so nobody assumes hidden/mock
functionality where none exists (see `SPEC.md`'s "no fake functionality" rule).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL/anon key
npm run dev
```

### Environment variables

See `.env.example`. At minimum for local dev you need:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Database

Schema lives in `supabase/migrations/`. Apply with the Supabase CLI or the Supabase MCP/dashboard:

```bash
supabase link --project-ref <ref>
supabase db push
```

### One manual dashboard step required

Anonymous ("guest") sign-ins are **disabled by default** in a new Supabase project. To make the
"Continue as guest" button work, enable it in the Supabase dashboard:
**Authentication → Providers → Anonymous Sign-Ins → Enable**. Google OAuth similarly needs a
client ID/secret configured under **Authentication → Providers → Google** before that button works.

### Tests / lint / typecheck

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

## Repository structure

```
app/                    Next.js App Router pages + API route handlers
components/ui/           Minimal hand-authored UI primitives (button, input, card)
lib/domain/               Core domain types + Zod validation schemas
lib/config/                Configurable constraints (room minimums, scoring weights)
lib/supabase/              Supabase client factories (browser/server)
supabase/migrations/       SQL migrations (source of truth for schema)
tests/                     Vitest unit tests
```

If a full monorepo (`apps/`, `packages/`, `workers/`) becomes necessary once the geometry
engine/worker are built, SPEC.md §73 explicitly allows starting simpler and restructuring later —
this repo intentionally starts simple.

## Next recommended step

Phase 2 (SPEC.md §90): build the real multi-step design wizard (plot → family → rooms → budget →
style → preferences) backed by the `plots` and `house_requirements` tables and schemas that
already exist.
