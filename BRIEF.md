# Project Brief

---

## Overview

A mobile-first, responsive web app for field crews and sustainability coordinators working in energy and natural resources. The app — called **FieldOps** — gives workers a fast, focused tool to log asset check-ins, file incident reports, view their route map, and clear a compliance task list — all from one hand, on a job site, with gloves on.

This is not a desk app made smaller. It's built for someone who needs to confirm a pipeline valve was inspected, flag a spill before walking away, and get to their next waypoint — without a laptop in sight.

---

## Users

- **Field Crew Member** — a technician or operator doing rounds on infrastructure assets (pipelines, solar arrays, substations, well pads). Working outdoors, often in low-signal areas, using their phone between physical tasks.
- **Sustainability Coordinator** — a compliance-focused role tracking environmental checks, safety incidents, and regulatory task completion across a site or region.

---

## Design Style

Utilitarian and trustworthy. This isn't a consumer app — every pixel should signal clarity, function, and durability. Visual direction:

- Industrial field gear aesthetic — hard-hat orange, deep steel, muted earth
- High contrast for outdoor readability (direct sunlight)
- Chunky tap targets — designed for gloves and one-handed use
- Status-driven UI — clear pass/fail/pending states throughout
- No decorative flourishes; form follows function
- Flat, icon-forward components with strong label support
- Feels like a field tablet app, not a mobile banking app

---

## Layout

- **Mobile-first** — designed at 390px, scales up to tablet and desktop
- Single-column layouts on mobile with full-bleed cards
- Bottom navigation bar with four primary routes: **Check-In**, **Incident**, **Map**, **Tasks**
- Each screen does one thing — no dashboards, no information overload
- Persistent status bar showing: current site name, last sync time, signal indicator
- Tap targets minimum 48px height; icon + label on all nav items

### Screens

**Asset Check-In**
- List of assets at current site (e.g. Valve A-12, Transformer T-04)
- Each asset: name, last checked timestamp, status badge (OK / Needs Attention / Skipped)
- Tap to check in — prompts for a condition note and optional photo
- "All clear" confirmation with timestamp on completion

**Incident Report**
- Short form: incident type (dropdown), location (auto-filled from GPS), description (text area), severity (Low / Medium / High toggle)
- Photo attachment option
- Submit button prominent and always visible — no buried scrolling required
- Success state: report ID + submission timestamp

**Route Map**
- Map view of the day's assigned waypoints (rendered with Leaflet.js using OpenStreetMap tiles)
- Current location marker, numbered stops, route line
- Tap a stop to see asset name, address, and any flagged items
- Simple — no traffic, no turn-by-turn; just the stops and the order

**Compliance Task List**
- Today's required tasks pulled from mock data (e.g. "Inspect secondary containment — Pad B", "Log meter reading — Station 7")
- Swipe-to-complete or tap checkbox
- Overdue tasks surfaced at top with amber/red indicators
- Completion counter at top: "4 of 7 complete"

---

## Interactions

- Transitions between **200ms and 300ms** — fast; this user is in a hurry
- Use `ease-in-out` or `cubic-bezier(0.4, 0, 0.2, 1)` consistently
- Swipe gestures supported on task list (swipe right to complete)
- Haptic-style feedback patterns (CSS only — no native APIs)
- No hover-dependent states — everything must work on touch
- Loading states use skeleton screens, not spinners where possible

---

## Typography

- Import via Google Fonts or host locally via `fontsource`
- Suggested pairing: **IBM Plex Sans** (body + UI) — highly legible at small sizes
- Establish hierarchy using **font weight before size**

| Role          | Weight | Size (rem) |
|---------------|--------|------------|
| H1            | 700    | 2.0        |
| H2            | 700    | 1.75       |
| H3            | 600    | 1.5        |
| H4            | 600    | 1.25       |
| H5            | 500    | 1.125      |
| H6            | 500    | 1.0        |
| Body          | 400    | 1.0        |
| Small/Label   | 400    | 0.875      |
| Caption       | 300    | 0.75       |

---

## Color

Ensure all foreground/background combinations meet **WCAG 2.2 AA** contrast ratios (4.5:1 for normal text, 3:1 for large text and UI components).

```css
--color-primary:           /* #E8590C  — field orange */
--color-primary-hover:     /* #C94D0A */
--color-secondary:         /* #1C3A4A  — deep steel */
--color-accent:            /* #F0A500  — amber alert */
--color-background:        /* #F4F2EE  — weathered white */
--color-surface:           /* #FFFFFF */
--color-border:            /* #D0CBC0 */
--color-text-primary:      /* #1A1A1A */
--color-text-secondary:    /* #5C5850 */
--color-success:           /* #2D7A4F  — inspection green */
--color-warning:           /* #D97706  — caution amber */
--color-error:             /* #B91C1C  — incident red */
--color-info:              /* #1D6FA4 */
```

---

## Spacing

- Base unit: **8px**
- All spacing, padding, margin, and gap values should be multiples of 8px

| Token    | Value |
|----------|-------|
| space-1  | 8px   |
| space-2  | 16px  |
| space-3  | 24px  |
| space-4  | 32px  |
| space-5  | 40px  |
| space-6  | 48px  |
| space-8  | 64px  |
| space-10 | 80px  |

---

## Border Radius

- **Cards:** `8px` _(utilitarian, not bubbly)_
- **Buttons:** `8px`
- **Input fields:** `8px`
- **Badges / Status chips:** `4px`
- **Modals / Dialogs:** `12px`

---

## Icons

- Use **Phosphor Icons** throughout the application
- Install via: `npm install @phosphor-icons/vue`
- **Prefer outlined variants** — use filled only for active/selected states
- Keep icon sizing consistent with surrounding text
- Do not mix Phosphor with other icon libraries
- All icons must include an `aria-label` or be accompanied by a visible text label

---

## Accessibility

This project **must meet WCAG 2.2 AA standards.** Key requirements:

- All interactive elements keyboard navigable
- Focus indicators clearly visible — especially important for form fields
- Color must not be the only means of conveying status (use icons + labels alongside color)
- All images and icons must have `alt` text or `aria-label`
- Form inputs must have associated labels
- Minimum contrast ratio: **4.5:1** for body text, **3:1** for large text and UI components
- Tap targets minimum **48×48px**
- Test with: axe DevTools, Lighthouse, and manual keyboard navigation

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Framework   | Vue 3                             |
| Build Tool  | Vite                              |
| UI Library  | Vuetify 3                         |
| Language    | TypeScript                        |
| Icons       | Phosphor Icons for Vue            |
| Map         | Leaflet.js + OpenStreetMap tiles  |

---

## Data

Generate a fake dataset as a JSON file (`src/data/fieldops.json`). The dataset should represent a single field crew's day at a fictional oil & gas / renewables hybrid site called **Ridgeline Energy — Site 4**.

Include:

- **assets** — 8–10 named assets (valves, transformers, meters, containment units) with IDs, type, location coordinates, last-checked timestamp, and status
- **incidents** — 2–3 pre-filed incidents with type, severity, description, coordinates, and timestamp
- **route** — ordered array of waypoint stops for the day, each with name, coordinates, and associated asset IDs
- **tasks** — 7–10 compliance tasks with name, associated asset, due time, completed boolean, and overdue flag
- **crew** — 2 crew members with name, role, employee ID, and assigned stops

Make timestamps feel like a real workday starting at 06:30. Mix completed and pending states. Keep data internally consistent — assets referenced in tasks should exist in the asset list.

---
