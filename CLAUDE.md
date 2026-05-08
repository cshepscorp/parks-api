# parks-api

Backend API for the Parks App — a national and state parks trip planning application.

## Project overview

A full-stack trip planning app that lets users search national and state parks,
save favorites, and plan road trips with ordered stops and drive time estimates.
This repo is the **Express backend only**. The React + Vite frontend lives in a
separate repo (`parks-client`, not yet created).

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js | Standard |
| Framework | Express | Separate from frontend — explicit layer separation |
| Database | PostgreSQL (local, Homebrew) | Relational data with enforced relationships |
| ORM | Prisma 5.22.0 | Schema-first, type-safe queries, standard setup |
| Auth | Passport.js + Google OAuth + JWT via HttpOnly cookie | No passwords, XSS protection |
| Park data | NPS API (proxied through this server) | Live data, closures, alerts |

## Architecture decisions

**Why PostgreSQL over MongoDB**
Park data is shared reference data — many users and trips point to the same parks.
Storing it relationally means one source of truth, no duplication. The data has
real enforced relationships: users own trips, trips contain ordered parks via a
join table, users favorite parks. PostgreSQL enforces referential integrity at the
database level.

**Why JWTs over sessions**
The frontend and backend are separate projects on different origins. JWTs are
stateless and travel explicitly in requests, avoiding cookie/CORS complexity
that sessions bring in a decoupled architecture.

**Why HttpOnly cookies over localStorage**
Removes the XSS attack surface entirely. JavaScript on the page cannot read
the token. Slightly more CORS setup, worth it for a real deployed app.

**Why the proxy pattern**
The NPS API key never touches the browser. The React frontend calls our Express
server, which attaches the key server-side and forwards the request to the NPS API.

## Environment

- Node.js v24.14.1
- PostgreSQL 16.13 via Homebrew, running on localhost:5432
- Database: `parks_dev`
- Prisma 5.22.0

## Getting started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your DATABASE_URL and NPS_API_KEY to .env

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

## Data model

```
users        → trips          (one to many)
trips        → trip_parks     (one to many)
trip_parks   → parks          (many to one — join table with stopOrder and driveTimeFromPrevious)
users        → favorites      (one to many)
favorites    → parks          (many to one)
```

## API routes

| Method | Path | Description | Auth required |
|---|---|---|---|
| GET | /health | Server health check | No |
| GET | /health/db | Database connection check | No |
| GET | /api/parks | Search parks via NPS API | No |
| GET | /api/parks/:id | Get park details | No |
| POST | /auth/google | Initiate Google OAuth | No |
| GET | /auth/google/callback | OAuth callback | No |
| GET | /api/trips | Get user's trips | Yes |
| POST | /api/trips | Create a trip | Yes |
| GET | /api/favorites | Get user's favorites | Yes |
| POST | /api/favorites | Save a favorite | Yes |

## Current status

- [x] PostgreSQL connected
- [x] Prisma schema with all five models
- [x] Initial migration
- [x] Express server with CORS, JSON parsing, dotenv
- [x] Health check routes
- [ ] Google OAuth + Passport.js
- [ ] Auth middleware
- [ ] NPS API proxy route
- [ ] Trip routes
- [ ] Favorites routes

## Project conventions

- ES modules throughout (`import`/`export`)
- All routes go in `src/routes/`
- Prisma client is a singleton exported from `src/db.js`
- Environment variables via dotenv, never hardcoded
- Secrets never committed — see `.gitignore`
