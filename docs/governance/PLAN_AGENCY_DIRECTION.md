# Agency Monorepo — Direction and Structure (Revised)

**Last updated:** From your choices on folder model, firm scope, Riley Day Care approach, and template.

**Build status:** Phase 1 (restructure) and Phase 2 (convert riverside-hotel → riley-day-care, seed) are **done**. Next: Phase 3 (Riley Day Care full build-out per spec), Phase 4 (firm site broad), Phase 5 (GUIDE/TODO path updates).

---

## Locked-in decisions

| Decision            | Your choice                                                                                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Folder model**    | **Option A** — `apps/prospective-clients/` (demo/test) and `apps/clients/` (real only).                                                                                                                                                          |
| **Firm site scope** | **Broad** — form, blogs, etc. (not just minimum pages).                                                                                                                                                                                          |
| **Riley Day Care**  | **Convert riverside-hotel → Riley Day Care** and build out the site in full per your spec.                                                                                                                                                       |
| **Template**        | **“Day Care Template”** for now — sufficient until you know the repo better; can be refined later (e.g. scaffold variant or dedicated template).                                                                                                 |
| **Riverside-hotel** | **In-place convert** — not preserved (not a real place). All current client apps are **prospective** (demo): **riley-day-care** and **the-barber-cave** in `apps/prospective-clients/`. `apps/clients/` is empty until first production go-live. |

---

## Riley Day Care build-out (spec source)

You specified building out the site in full using: **https://share.google/3MQFHVDZjzpTBa8kV**

- That link is not readable from here (auth/share required). When implementing, the build-out should follow the **content, structure, and requirements** from that spec.
- **Practical next step:** Either paste the key sections (pages, features, copy, forms, blog requirements) into this repo (e.g. `docs/riley-day-care-spec.md`) or keep the link and refer to it during implementation so the agent has the full spec in context.

---

## Target structure (Option A)

```
apps/
  firm/                        # Agency marketing site (broad: form, blogs, etc.)
  agency-admin/                # Internal dashboard
  prospective-clients/         # Demo/test only (all current client apps)
    riley-day-care/            # Day Care Template
    the-barber-cave/           # Barber shop (Dallas) demo
  clients/                     # Production clients only (empty until first go-live)
```

- **Riley Day Care** and **The Barber Cave** both live under `apps/prospective-clients/`. The scaffold template is `riley-day-care`. **Production clients** will go in `apps/clients/` when the first real client goes live.
- **Template:** For now, a **“Day Care Template”** suffices — e.g. the Riley Day Care app (once built) can serve as the template for future day-care-style clients, or the scaffold can later get a “day care” variant. You can decide the exact mechanism after you understand the repository better.

---

## Implementation plan (with your choices)

### Phase 1: Restructure (prospective vs real)

- Create `apps/prospective-clients/`. **Done:** Riley Day Care and The Barber Cave live in `apps/prospective-clients/`. `apps/clients/` is empty (for production go-live).
- **Prospective clients:** `riley-day-care` (Day Care Template) and `the-barber-cave` (barber shop demo). No acme-health; removed from repo.
- Update **tokens build** to support both `apps/prospective-clients/*/tokens/` and `apps/clients/*/tokens/`. **Done:** `PROSPECTIVE_SLUGS` lists riley-day-care and the-barber-cave.
- Update **scaffold script** to create apps under either `prospective-clients` or `clients`; template is `apps/prospective-clients/riley-day-care`. **Done.**
- Update **root tsconfig** references, **turbo** outputs, **docs**, and **TODO** paths.

### Phase 2: Riley Day Care (convert + build out)

- Convert riverside-hotel → Riley Day Care (slug `riley-day-care`, display name, tokens, tenant, env).
- Build out the site **in full** per the spec at your Google link (content, pages, form, blog, etc.). Spec details to be provided in repo or pasted when implementing.
- Treat the resulting app as the **“Day Care Template”** for now (reference for future similar clients).

### Phase 3: Firm site (broad)

- Expand firm site: form(s), blogs, and other pages as needed to meet “broad” scope.
- Deploy when ready.

### Phase 4: Documentation and template option

- Document the Option A layout (e.g. in docs/CODEBASE_ANALYSIS.md or docs/ARCHITECTURE.md); Riley Day Care as first real client, and “Day Care Template” as the current template approach.
- When you’re ready, document how new “day care” clients are created (e.g. “scaffold from riley-day-care” or a dedicated day-care template in the scaffold script).

---

## Summary

- **Option A** confirmed; **broad** firm site; **Riley Day Care** = converted riverside-hotel + full build-out per your spec; **Day Care Template** for now. Spec content from your link should be in the repo or pasted when building so the implementation matches your vision.
