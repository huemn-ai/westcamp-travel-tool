# West Camp Debrief Plan

A collaborative trip-planning web app for coordinating meals, activities, and shopping for a group getaway.

## Features

- **Interactive Calendar** — Hour-scaled day view with weather overlay and auto-placed activities
- **Collaborative Voting** — 1st and 2nd choice ranking for meals, activities, and leisure options
- **Multi-Step Wizard** — Guided voting flow for all trip decisions
- **Smart Shopping List** — Auto-generates ingredient lists from winning recipes, scaled for 7 people
- **Drag-to-Reschedule** — Move calendar blocks to adjust timing
- **Mobile-Optimized** — Bottom-sheet modals and touch-friendly interactions on phones

## Tech Stack

- Single-file HTML with inline CSS and vanilla JavaScript
- `window.storage` API for shared state persistence
- No build step — deploy directly to any static host

## Deployment

This site is deployed on Netlify. Push to the main branch to auto-deploy.

```bash
git push origin main
```

## Local Development

Open `index.html` in a browser. All state is stored in `window.storage` and persists across page reloads.

## Trip Details

- **Dates:** Thursday July 9 – Saturday July 11, 2026
- **Location:** Catskills, NY
- **Group Size:** 7 people
- **Attendees:** Amanda, Belal, Luke, Mina, Nada, Stefano, Yehia
