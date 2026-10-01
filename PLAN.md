# FieldOps Project Plan

## Objective

Give field crews a clear, one-handed tool for site check-ins, incident reporting, route navigation, and daily compliance work at Ridgeline Energy — Site 4.

## Milestones

- [x] **Discovery:** define users, site workflows, and accessibility requirements in [BRIEF.md](BRIEF.md).
- [x] **Design:** establish the high-contrast industrial visual system and mobile navigation.
- [x] **Build:** scaffold Vue 3/Vite/TypeScript and implement the four workflows with mock data.
- [x] **Verify:** production type-check/build passes; desktop and mobile layouts and core navigation were browser-checked.
- [ ] **Release:** replace mock data and define the deployment and offline-sync strategy.

## Success Criteria

- Crew members can complete all four workflows on a phone with touch targets at least 48px high.
- Status is communicated with labels and icons as well as color.
- Site data is internally consistent and field edits persist locally between reloads.
- Production build passes and core screens remain usable at mobile, tablet, and desktop widths.

## Current Scope

- Local mock data for one fictional hybrid energy site and two crew members.
- Browser-local persistence for asset check-ins, incidents, and tasks.
- OpenStreetMap-backed Leaflet route map.

## Follow-up

- [ ] Connect to an authenticated API and implement background sync/retry.
- [ ] Decide photo storage and upload behavior for low-signal areas.
- [ ] Run axe, Lighthouse, and manual keyboard/screen-reader checks; verify WCAG 2.2 AA contrast.
- [ ] Confirm geographic coordinates and regulatory task definitions with site operators.
