# BedMitr

Real-time ICU bed availability for metropolitan hospitals. Citizens find open capacity before routing through traffic; hospital staff publish live counts; administrators govern users and facilities.

## Stack

- **Frontend:** React (Vite), React Router, Tailwind CSS, Framer Motion, Recharts, Lucide icons
- **Backend:** Node.js, Express, JWT, bcrypt, express-validator
- **Database:** MySQL 8+

## Prerequisites

- Node.js 18+
- MySQL 8+ **or** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended on Windows)

## Why login / API calls fail (`ECONNREFUSED`)

The React app proxies `/api` to **http://localhost:5000**. That error means the **Express API is not running** or MySQL is down so the API exits on startup. Always run the **server** (or use the single command below).

## Quick start (Docker MySQL + API + web)

From the **project root** (`BedMitr/`):

1. Start MySQL (first time may take a minute to initialize):

   ```bash
   docker compose up -d
   ```

2. Install dependencies (root, server, client):

   ```bash
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

3. Ensure `server/.env` exists (copy from `server/.env.example` if needed). Defaults match Docker: user `bedmitr`, password `bedmitr_app`, database `bedmitr`.

4. Load demo data:

   ```bash
   cd server
   npm run seed
   cd ..
   ```

5. Start **API + Vite together** (fixes proxy errors):

   ```bash
   npm run dev
   ```

- App: http://localhost:5173  
- API: http://localhost:5000/api/health  

If you already use **local MySQL** (not Docker), edit `server/.env` with your real `DB_USER` / `DB_PASSWORD`, run `mysql ... < server/database/schema.sql` once, then `npm run seed` in `server/`.

## Manual setup (two terminals)

**Terminal 1 — API** (must be running before the app can log in):

```bash
cd server
npm install
npm run dev
```

**Terminal 2 — web:**

```bash
cd client
npm install
npm run dev
```

(`npm start` in `client/` also runs Vite; do **not** run `npm start dev` — use `npm run dev` or `npm start`.)

## Seed accounts

After `npm run seed` in `server/`:

- `admin@bedmitr.local` / `Admin123!`
- `icu.staff@apollohyd.com` / `Hospital123!` (Apollo Hyderabad)
- `citizen@demo.com` / `User123!`

## Roles

| Role       | Capabilities |
|-----------|---------------|
| **user**  | Browse ICU map, hospital details, save favorites, citizen dashboard |
| **hospital** | Update own hospital’s available ICU beds (audited log) |
| **admin** | Full hospital CRUD, user management, stats dashboard |

## Production notes

- Use HTTPS, rotate `JWT_SECRET`, and restrict CORS to your frontend origin.
- Run `npm run build` in `client` and serve static files behind nginx or similar.
- Back up MySQL regularly; consider read replicas for heavy public traffic.

## Deploy frontend to Vercel

This repo is a **monorepo** (`client/` + `server/`). Vercel is best used here to deploy the **frontend**.

- **Vercel project**: import the GitHub repo, then deploy.
- **Frontend build**: handled via `vercel.json` (builds `client/` as a Vite static site).
- **SPA routing**: handled via `vercel.json` rewrites (React Router refresh works).
- **API in production**: you must deploy the Express API somewhere else (Render/Railway/Fly.io/VM) and then set:
  - `VITE_API_BASE_URL` in Vercel Environment Variables (example: `https://your-api.example.com/api`)

Local development stays the same: the Vite dev server proxies `/api` to `http://localhost:5000`.

## Disclaimer

BedMitr is a demonstration routing aid. Always follow local EMS protocols and official emergency numbers (e.g. 108 in India). Bed counts are only as accurate as the data entered by authorized hospital users.
