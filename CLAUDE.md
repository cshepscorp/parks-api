# Parks App — Backend API (parks-api)

## How to restart a session with Claude

Paste this file's contents at the start of a new conversation and say:
**"I'm continuing work on the parks app backend. Here's my CLAUDE.md for context."**

Then paste your current `schema.prisma` so Claude can see exactly where the schema stands.

---

## Project overview

A full-stack national and state parks trip planning app. This repo is the **Express backend only**. The React + Vite frontend lives in a separate repo (`parks-client`, not yet created).

**The app allows users to:**
- Search national and state parks by keyword, location, and amenity filters
- Save favorite parks
- Plan and save road trips with ordered park stops and drive time estimates between stops
- Export trips as GPX files for Google/Apple Maps
- Access saved trips and favorites offline

---

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js | Standard |
| Framework | Express | Learning the seams explicitly — separate from frontend |
| Database | PostgreSQL (local, Homebrew) | Relational data with real relationships — parks shared across users/trips |
| ORM | Prisma 7.8 | Type-safe queries, schema-first, modern DX |
| Auth | Passport.js + Google OAuth + JWT via HttpOnly cookie | No passwords, XSS protection |
| Park data | NPS API (proxied through this server) | Live data, closures, alerts |

---

## Environment

- macOS, Apple Silicon (arm64)
- Node.js v24.14.1
- PostgreSQL 16.13 via Homebrew, running on localhost:5432
- Database name: `parks_dev`
- Prisma 7.8 (note: config lives in `prisma.config.ts`, NOT `schema.prisma`)

---

## Important Prisma 7 notes

Prisma 7 changed how database connection is configured:

- **Database URL** lives in `prisma.config.ts` — NOT in `schema.prisma`
- `schema.prisma` datasource block only needs `provider = "postgresql"` — no `url` field
- The `.env` file is read by `prisma.config.ts` via `import "dotenv/config"`
- Connection string format: `postgresql://christysheppard@localhost:5432/parks_dev`
- Generator uses `"prisma-client"` (not the older `"prisma-client-js"`)
- Output path: `../generated/prisma`

---

## Current schema status

### Completed models
- `User` — id, googleId, name, email, createdAt + relations to Trip and Favorite
- `Trip` — id, userId, name, createdAt + relations to User and TripPark
- `TripPark` — id, tripId, parkId, stopOrder, driveTimeFromPrevious (nullable Int?) + relations to Trip and Park
- `Favorite` — id, userId, parkId + relations to User and Park

### Still needed
- `Park` model — **this is where we left off**

### Park model fields to define (plain English, not yet written):
Think about what the NPS API returns (name, coordinates, state, description),
what the app needs for search results and detail pages, and
what fields support amenity filtering (dogs allowed, camping, RV hookups).

---

## Data model relationships

```
users        → trips          (one to many — user owns many trips)
trips        → trip_parks     (one to many — trip has many stops)
trip_parks   → parks          (many to one — each stop references one park)
users        → favorites      (one to many — user has many favorites)
favorites    → parks          (many to one — each favorite references one park)
```

---

## What we've installed so far

```bash
npm install express cors dotenv
npm install prisma --save-dev
npm install @prisma/client
```

## What still needs installing

- `passport` + `passport-google-oauth20` — OAuth
- `jsonwebtoken` — JWT creation and verification
- `cookie-parser` — reading HttpOnly cookies in Express
- `nodemon` or similar — dev server auto-restart

---

## Next steps (in order)

1. **Finish the Park model** in `schema.prisma`
2. **Run first migration** — `npx prisma migrate dev --name init`
3. **Scaffold Express server** — `src/index.js`, basic middleware setup
4. **Write a health check route** — confirm server is running
5. **Set up Passport + Google OAuth**
6. **Write auth middleware** — protect routes that require a logged-in user
7. **Write first real route** — GET /api/parks (proxies NPS API)

---

## Study guide

Reference docs live at the GitHub Pages site built alongside this project.
All docs are plain HTML files with a shared `styles.css` and `theme.js`.
Landing page: `index.html`

Topics covered so far:
- Node.js & Express
- Node.js internals (V8, event loop, built-ins)
- The proxy pattern
- Frontend terminology
- Databases & ORMs
- Authentication (sessions, JWTs, OAuth)
- Terminal, shell & CLI basics

---

## Learning context

Christy is an experienced developer who was deliberately steered toward
frontend work early in her current role while peers were given backend
exposure. She is NOT a junior — she reasons well, asks sharp questions,
and catches inconsistencies. The gap is backend fundamentals and system
design, not general engineering ability.

Working through decisions deliberately — understanding the *why* behind
each choice, not just the implementation. Senior engineer mentorship style.
Interview prep and portfolio building are the immediate goals.
