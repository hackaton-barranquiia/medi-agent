# MediAgent Visual Style Standard

This project adopts the **IBM (Carbon-inspired)** visual language from `getdesign.md` as the official design baseline for frontend refactors.

## Official design reference

- Canonical file for implementation: `DESIGN.md` (project root)
- Selected source: `https://getdesign.md/ibm/design-md`
- Install command used:

```bash
npx getdesign@latest add ibm
```

## Why this style was selected

- Works well for operational dashboards with dense, structured information.
- Communicates trust and clarity for a healthcare-adjacent workflow.
- Supports clear hierarchy for statuses, alerts, and real-time cards.
- Matches MediAgent needs better than overly playful or marketing-heavy styles.

## Mandatory visual rules for MediAgent UI

- **One accent color:** IBM Blue (`#0f62fe`) for primary actions, links, and focus.
- **Flat geometry:** Prefer square/near-square corners (0-4px), avoid pill-heavy UI.
- **No decorative shadows:** Use thin borders and surface contrast for hierarchy.
- **Structured neutral surfaces:** White and light grays as base.
- **Readable enterprise typography:** Clear hierarchy, restrained weights, high legibility.

## Scope of usage

This standard applies to:

- `src/app/page.tsx` dashboard layout
- `src/components/dashboard/*`
- Any new dashboard or operator-facing screens

If a component needs to deviate from this style, document the reason in the PR or task notes before merging.

