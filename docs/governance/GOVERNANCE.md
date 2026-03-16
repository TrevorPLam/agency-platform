# Design system governance

Lightweight governance for the shared design system (tokens, `@agency/ui`, and related packages). For detailed guidance on roles, RFCs, and cadence, see [docs/RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md](./RESEARCH_MARKETING_MONOREPO_DESIGN_2026.md) §11a.

---

## Roles

| Role | Responsibility |
|------|----------------|
| **Lead** | Vision, roadmap, change control; final say on disputes; approves major/minor releases and deprecations. |
| **Maintainers** | Steward components, docs, and CI; review and merge; enforce a11y and performance gates. |
| **Contributors** | Propose RFCs, file issues, open PRs, pilot new components. |
| **Consumers** | Use components and tokens in apps; give feedback. |

---

## Contribution workflow

Propose need and context → collaborate with the system team → review by maintainers → approve → implement and publish. For larger or breaking changes, use an **RFC** (or design doc) that captures context, proposal, impact, and migration path.

---

## Cadence

Align with [docs/VERSIONING.md](./VERSIONING.md): patch as needed, minor for backwards-compatible features, major with a review window and migration path. Without explicit governance, systems drift into ad hoc decisions; this doc is the lightweight “contract” for who decides and how.

---

## Adoption (optional)

To track design system usage (e.g. which apps use `@agency/ui`, which tokens are used), use a lightweight script or grep over the repo, or integrate with Figma Library Analytics if design uses Figma. Document findings in CONTRIBUTING or here when adopted. See research §14.
