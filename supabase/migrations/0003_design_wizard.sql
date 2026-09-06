-- Phase 2: design wizard (SPEC.md §38).
-- Adds the two house_requirements fields the wizard's Budget and
-- Preferences steps collect that Phase 1's schema didn't yet cover:
-- construction quality (CostEngine's `quality_level`, SPEC.md §31) and
-- design priorities (the AI design-intent contract's `priorities`,
-- SPEC.md §23) — Vastu itself already has its own `vastu_enabled` column.

alter table public.house_requirements
  add column if not exists construction_quality text not null default 'STANDARD'
    check (construction_quality in ('ECONOMY', 'STANDARD', 'PREMIUM')),
  add column if not exists design_priorities text[] not null default '{}'::text[]
    check (
      design_priorities <@ array['NATURAL_LIGHT', 'PRIVACY', 'LARGE_ROOMS', 'LOW_COST', 'OPEN_SPACES']::text[]
    );
