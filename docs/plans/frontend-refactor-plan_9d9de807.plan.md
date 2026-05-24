---
name: frontend-refactor-plan
overview: Define and execute a usability-first visual refactor for the dispenser dashboard, aligned with the provided UX decisions and the current DESIGN.md direction.
todos:
  - id: lock-requirements
    content: Map all confirmed UX requirements into non-negotiable section and interaction rules.
    status: pending
  - id: restructure-layout
    content: Refactor page into role-based sections with explicit navigation and compact hierarchy.
    status: pending
  - id: optimize-assistant-flow
    content: Tune scheduled board and status lanes for fast preparation and delivery marking.
    status: pending
  - id: align-design-system
    content: Apply active DESIGN.md tokens and visual hierarchy while preserving monochrome + alert accents.
    status: pending
  - id: validate-functional-ux
    content: Run build/lint and verify lifecycle, realtime, KPI, and mobile usability acceptance criteria.
    status: pending
isProject: false
---

# Frontend Refactor Plan

## Goal
Refactor the dashboard into a sectioned, operator-friendly interface optimized for two primary users (Supervisor and Distribution Assistant), with compact density, clear state transitions, and fast access to time-based preparation workflows.

## Product Requirements (Locked)
- Two primary users: Supervisor + Distribution Assistant.
- Equal importance across operations (no single-flow dominance).
- Must expose:
  - Hourly agenda
  - Calls in progress
  - Small critical-risk area
- Visual density: compact.
- Visual style: mostly monochrome with punctual alerts.
- Time-board requirement: show hourly slots and enable easy state changes (`scheduled` -> `ready_for_pickup` -> `delivered`).
- Primary row actions: `Mark ready` and `Mark delivered`.
- No in-row historical timeline required.
- Must work for desktop and mobile (assistant will use mobile often).
- Operational risk focus: prevent wrong order preparation and missed schedule windows.

## Information Architecture (Section-first)
- Introduce persistent section navigation (sidebar on desktop; section jump/compact nav on mobile).
- Structure the page by role and workflow:
  1. **Supervisor Overview**
     - KPI strip (appointments, deliveries, compliance)
     - Calls block (today + in-progress)
     - Critical block (urgent queue + overdue slots)
  2. **Preparation Workflow (Assistant-first)**
     - Hourly scheduled-orders board with clear action affordances
     - State board grouped by status lanes for quick scanning
  3. **Supporting Operational Context**
     - Pending prescriptions (prioritized)
     - Stock status

## Visual System Alignment (DESIGN.md)
- Use the active `DESIGN.md` as source of truth for color, typography, spacing, and shape.
- Make section boundaries explicit via surface contrast and card grouping.
- Keep monochrome baseline; reserve color for:
  - Critical alerts
  - Lifecycle status signals
  - Primary operational CTA emphasis
- Ensure visual hierarchy favors “what to do now” over decorative branding.

## Interaction Model
- Keep actions inline and minimal clicks:
  - `Mark ready` available only for `scheduled`
  - `Mark delivered` available only for `ready_for_pickup`
- Preserve realtime updates across sections (including UPDATE events).
- Ensure state changes are reflected in all relevant sections (board, scheduled list, KPIs).

## Mobile Usability Strategy
- Prioritize assistant workflow first on small screens:
  - Scheduled orders and state actions visible without deep scrolling.
- Collapse secondary context into compact blocks.
- Maintain touch-safe action targets and compact but readable row density.

## File-Level Implementation Scope
- Page composition and section hierarchy:
  - [src/app/page.tsx](src/app/page.tsx)
- Navigation and top chrome:
  - [src/components/dashboard/header.tsx](src/components/dashboard/header.tsx)
  - [src/components/dashboard/sections-sidebar.tsx](src/components/dashboard/sections-sidebar.tsx)
- Supervisor blocks:
  - [src/components/dashboard/kpi-strip.tsx](src/components/dashboard/kpi-strip.tsx)
  - [src/components/dashboard/calls-overview.tsx](src/components/dashboard/calls-overview.tsx)
  - [src/components/dashboard/critical-panel.tsx](src/components/dashboard/critical-panel.tsx)
  - [src/app/api/dashboard/overview/route.ts](src/app/api/dashboard/overview/route.ts)
- Assistant workflow blocks:
  - [src/components/dashboard/scheduled-orders.tsx](src/components/dashboard/scheduled-orders.tsx)
  - [src/components/dashboard/live-appointments.tsx](src/components/dashboard/live-appointments.tsx)
  - [src/components/dashboard/appointment-actions.tsx](src/components/dashboard/appointment-actions.tsx)
- Supporting context blocks:
  - [src/components/dashboard/pending-prescriptions.tsx](src/components/dashboard/pending-prescriptions.tsx)
  - [src/components/dashboard/pending-prescriptions-list.tsx](src/components/dashboard/pending-prescriptions-list.tsx)
  - [src/components/dashboard/stock-status.tsx](src/components/dashboard/stock-status.tsx)
- Global token alignment:
  - [src/app/globals.css](src/app/globals.css)

## Acceptance Criteria
- Sections are clearly accessible (desktop sidebar + mobile-friendly section access).
- Users can complete preparation and delivery transitions with minimal friction.
- Critical and in-progress call signals are visible but not visually overwhelming.
- Dashboard remains compact and scan-friendly on desktop and mobile.
- Wrong-preparation risk is reduced by clearer slot/patient/status association.
- Missed-window risk is reduced by overdue and hourly visibility.
- Build passes and no new lint errors.

## Validation Checklist
- Functional:
  - Lifecycle actions still enforce valid transitions.
  - Realtime UPDATE propagation still works.
  - KPI and overview endpoints return expected shape.
- UX:
  - Supervisor can identify priorities in <10 seconds.
  - Assistant can move a slot from `scheduled` to `delivered` in <=2 actions.
  - Mobile view keeps scheduling actions above fold for active work windows.
