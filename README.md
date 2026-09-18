# Pipeline — Spatialytics

Lean **CRM + jobs + map** for Greater Minnesota small businesses.

Not Salesforce. Contacts, deal board, field jobs, and a map — simple enough to use the same day.

**Repo:** https://github.com/KristineMK72/spatialytics-pipeline

## Features (MVP)

- **Today** — follow-ups and open jobs due soon / overdue
- **Board** — drag-and-drop pipeline: Lead → Qualified → Proposal → Won / Lost
- **Contacts** — accounts with city, phone, email, optional lat/lon
- **Jobs** — field work linked to accounts
- **Map** — dark basemap with account markers and open job pins
- **Local-first** — data in `localStorage` (sample Brainerd-area data included)

## Stack

- Next.js 14 (App Router)
- React 18
- Leaflet (map)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Connect this repo to **Vercel** → Deploy. No env vars required for the MVP.

## Sample data

Includes demo accounts around Brainerd / Baxter / Staples. Use **Reset sample data** in the sidebar to restore.

## Roadmap

- Auth + multi-user
- Postgres instead of localStorage
- Link to Spatialytics OS territories
- Assign jobs to ShiftSprout crews
- CSV import/export
