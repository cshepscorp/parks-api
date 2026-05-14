# parks-api

Backend API for the Parks App — a national and state parks trip planning application.

## Project overview

A full-stack trip planning app that lets users search national and state parks,
save favorites, and plan road trips with ordered stops. This repo is the **Express backend only**. The React + Vite frontend lives in `parks-client`.

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js | Standard |
| Framework | Express | Separate from frontend — explicit layer separation |
| Database | PostgreSQL (Railway in production, Homebrew locally) | Relational data with enforced relationships |
| ORM | Prisma 5.22.0 | Schema-first, type-safe queries |
| Auth | Passport.js + Google OAuth + JWT via HttpOnly cookie | No passwords, XSS protection |
| Park data | NPS API (proxied through this server) | Live data |
| Rate limiting | express-rate-limit | 100 req/15min production, 1000 dev |

## Architecture decisions

**Why PostgreSQL over MongoDB**
Park data is shared reference data — many users and trips point to the same parks.
Real enforced relationships: users own trips, trips contain ordered parks via a
join table, users favorite parks. PostgreSQL enforces referential integrity.

**Why JWTs over sessions**
Frontend and backend are separate projects on different origins. JWTs are stateless.

**Why HttpOnly cookies over localStorage**
Removes XSS attack surface. JavaScript cannot read the token.

**Why the proxy pattern**
The NPS API key never touches the browser.

**Why `api.christinasheppard.com` subdomain**
Cookies set on `api.christinasheppard.com` are sent by the browser to that domain.
The frontend at `parks.christinasheppard.com` calls the API directly — no CloudFront
proxy in between stripping cookies. Both are subdomains of the same parent domain.

## Environment

- Node.js v24.14.1
- PostgreSQL locally: `parks_dev` on localhost:5432 via Homebrew
- PostgreSQL production: Railway managed, DATABASE_PUBLIC_URL with ?sslmode=require
- Prisma 5.22.0

## Getting started

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

## Environment variables

```
DATABASE_URL=postgresql://localhost:5432/parks_dev
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=
NPS_API_KEY=
NODE_ENV=development
CLIENT_URL=http://localhost:5174
API_URL=http://localhost:3000
```

## Data model

```
User → Trip (one to many)
Trip → TripPark (one to many)
TripPark → Park (many to one — join table with stopOrder, driveTimeFromPrevious)
User → Favorite (one to many)
Favorite → Park (many to one)
Park.imageUrl — stored on first favorite/trip add, updated on re-add
```

## API routes

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | /health | No | Server health |
| GET | /health/db | No | DB connection |
| GET | /auth/google | No | Initiate OAuth |
| GET | /auth/google/callback | No | OAuth callback |
| GET | /auth/me | Yes | Returns decoded JWT user |
| GET | /auth/logout | No | Clears cookie, redirects to CLIENT_URL |
| GET | /api/parks | No | NPS proxy — supports q, stateCode, limit, start |
| GET | /api/parks/:id | No | Single park by parkCode |
| GET | /api/trips | Yes | Returns trips with nested tripParks and parks |
| POST | /api/trips | Yes | Create trip |
| DELETE | /api/trips/:id | Yes | Deletes TripPark records first, then trip |
| POST | /api/trips/:tripId/parks | Yes | Upserts park, creates TripPark, checks duplicates |
| DELETE | /api/trips/:tripId/parks/:tripParkId | Yes | Remove park from trip |
| GET | /api/favorites | Yes | Returns favorites with nested park |
| POST | /api/favorites | Yes | Upserts park, creates favorite |
| DELETE | /api/favorites/:npsId | Yes | Deletes by npsId (not internal ID) |

## Project conventions

- ES modules throughout (`import`/`export`)
- All routes in `src/routes/`
- Prisma singleton exported from `src/db.js`
- `requireAuth` middleware in `src/middleware/auth.js`
- Environment variables via dotenv, never hardcoded
- `start` script runs `npx prisma migrate deploy && node src/index.js`

## Important gotchas

- Delete trip must delete TripPark records FIRST or FK constraint fails
- Park upsert `update` block must include `imageUrl` — create block alone isn't enough
- Favorites DELETE uses `npsId` not internal `parkId` — consistent with frontend
- `DATABASE_URL` must NOT have quotes around it in Railway variables
- DNS records for `api.christinasheppard.com` live in Route 53, not Bluehost
- `prisma.config.ts` leftover from Prisma 7 experiments was deleted — don't recreate it
- Railway PORT is injected as 8080 — networking must be configured to match
- Internal Railway DNS (`postgres.railway.internal`) doesn't work — use DATABASE_PUBLIC_URL

## Prisma schema models

User, Trip, TripPark, Favorite, Park — all 5 tables exist in production.
Park model has `imageUrl String?` added via migration `add_image_url_to_park`.