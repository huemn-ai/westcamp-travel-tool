# West Camp Debrief Plan

A collaborative trip-planning web app for coordinating meals, activities, and shopping for a group getaway.

## Features

- **Interactive Calendar** — Hour-scaled day view with weather overlay and auto-placed activities
- **Collaborative Voting** — 1st and 2nd choice ranking for meals, activities, and leisure options
- **Multi-Step Wizard** — Guided voting flow for all trip decisions
- **Smart Shopping List** — Auto-generates ingredient lists from winning recipes, scaled for 7 people
- **Drag-to-Reschedule** — Move calendar blocks to adjust timing
- **Mobile-Optimized** — Bottom-sheet modals and touch-friendly interactions on phones
- **Real-Time Sync** — All preferences saved to Supabase and synced across users

## Tech Stack

- Single-file HTML with inline CSS and vanilla JavaScript
- **Supabase** for persistent preference storage and real-time sync
- No build step — deploy directly to any static host

## Supabase Setup

This app uses Supabase to store and sync user preferences across all participants.

### Database Schema

The app uses four main tables:

1. **preferences** — Stores voting choices
   - `guest_name` (TEXT) — Name of the voter
   - `poll_id` (TEXT) — Which poll (e.g., "poll-fri-dinner")
   - `first_choice` (TEXT) — 1st choice option ID
   - `second_choice` (TEXT) — 2nd choice option ID
   - Unique constraint: `(guest_name, poll_id)`

2. **write_ins** — Stores write-in dish suggestions
   - `poll_id` (TEXT) — Which poll
   - `text` (TEXT) — The suggested dish
   - `updated_by` (TEXT) — Who suggested it
   - Unique constraint: `poll_id`

3. **schedule_changes** — Stores manual calendar adjustments
   - `day_key` (TEXT) — Day (thu/fri/sat)
   - `block_id` (TEXT) — Activity block ID
   - `start_minutes` (INTEGER) — Start time in minutes from 10 AM
   - `duration` (INTEGER) — Duration in minutes
   - `manual` (BOOLEAN) — Whether this was manually adjusted
   - Unique constraint: `(day_key, block_id)`

4. **shopping_items** — Stores shopping list check status
   - `item_id` (TEXT) — Unique item identifier
   - `checked` (BOOLEAN) — Whether item is packed
   - Unique constraint: `item_id`

### Row Level Security (RLS)

All tables have RLS enabled with public read/write policies, allowing any user to view and modify preferences. This is appropriate for a shared trip planning app where all participants should see each other's choices.

### Credentials

The app uses Supabase's **anon (public) key** for client-side access:
- **Project URL**: `https://xstcdokwuhivywqedkni.supabase.co`
- **Publishable Key**: `sb_publishable_AoCN4tV0yHXHo7eh2YN1JQ_RnXpfsGy`

These are embedded in the HTML and are safe to expose (they only allow public read/write via RLS policies).

## Deployment

This site is deployed on Netlify. Push to the main branch to auto-deploy.

```bash
git push origin main
```

## Local Development

Open `index.html` in a browser. All state is stored in Supabase and persists across page reloads and devices.

## Trip Details

- **Dates:** Thursday July 9 – Saturday July 11, 2026
- **Location:** Catskills, NY
- **Group Size:** 7 people
- **Attendees:** Amanda, Belal, Luke, Mina, Nada, Stefano, Yehia
