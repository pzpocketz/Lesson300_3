# FieldOps

A mobile-first fieldwork console for crews and sustainability coordinators at Ridgeline Energy — Site 4. Record asset conditions, file incident reports, follow the day's route, and complete compliance checks from a touch-friendly interface.

## Stack

- Vue 3 and TypeScript
- Vite
- Vuetify 3
- Phosphor Icons for Vue
- Leaflet with OpenStreetMap tiles
- IBM Plex Sans (bundled locally)

## Getting Started

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Vite prints the local URL when the development server starts.

## Access Gate

The password gate is client-side and intended for demo access only. Its password is included in the browser bundle, so it does not protect sensitive data. Use server-side authentication before production deployment.

## Workflows

- **Check-in:** search site assets, record condition and notes, and attach a photo.
- **Incident:** create a report with type, GPS/manual location, severity, description, and optional photo.
- **Map:** inspect the ordered route, waypoint assets, and crew location.
- **Tasks:** review due and overdue compliance work; tap or swipe right to complete a task.
- **Appearance:** toggle the light or dark theme from the header; the choice is saved on this device.

Edits persist in browser local storage. The route map uses OpenStreetMap tiles and needs a network connection. Mock site data lives in `src/data/fieldops.json`.

## Commands

```sh
npm run dev      # Start the local development server
npm run build    # Type-check and create a production build
npm run preview  # Preview the production build
```

See [BRIEF.md](BRIEF.md) for product requirements and [PLAN.md](PLAN.md) for delivery status and follow-up work.
