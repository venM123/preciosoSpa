# Precioso (Ladyboss Clinic Booking)

Clinic booking web app with admin and customer flows, built with Node.js, Express, EJS, and MariaDB/MySQL.

## Features
- Admin: auth, services, branch services, bookings, and reports
- Customer: auth, service browsing, and booking flow
- Server-side rendered views with EJS
- Session-based authentication and basic rate limiting

## Tech stack
- Node.js + Express
- EJS templates
- MariaDB/MySQL (mysql2)
- Nodemailer for email

## Prerequisites
- Node.js 18+ and npm
- MariaDB/MySQL (or Docker Desktop to run the provided compose file)

## Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Create a `.env` file in the project root:
```env
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=ladyboss_user
DB_PASSWORD=strongpassword
DB_NAME=ladyboss_booking

SESSION_SECRET=change-me
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@ladyboss.local

ADMIN_NOTIFY_EMAIL=
CUSTOMER_AUTH_ENABLED=true
NODE_ENV=development
```

### 3) Start the database (Docker option)
A `docker-compose.yml` is included in the project root. From the repo root:
```bash
docker compose up -d
```

### 4) Run migrations
From the repo root (PowerShell-safe):
```bash
Get-Content .\db\migrations\001_init.sql | docker exec -i ladyboss_mariadb mariadb -u root -prootpassword ladyboss_booking
Get-Content .\db\migrations\002_branch_services.sql | docker exec -i ladyboss_mariadb mariadb -u root -prootpassword ladyboss_booking
```

For more detailed Windows/Docker steps, see `Setup MariaDB DB with Docker (Windo.txt)`.

## Run
```bash
npm run dev   # dev with nodemon
npm start     # production-ish
```

App runs at `http://127.0.0.1:3000` by default.

## Deployment notes (based on repo)
- No build step is required; start the server with `npm start`.
- Entry point: `src/server.js` (uses `PORT` from `.env`).
- Views are server-rendered from `src/views` (EJS) and static assets are served from `public`.
- Sessions require `SESSION_SECRET`; cookies are marked `secure` when `NODE_ENV=production`.
- Ensure DB connectivity using `DB_*` env vars and apply the migrations in `db/migrations`.

## Health check
```bash
GET /health
```

## Useful routes
- Admin: `/admin` (auth and management)
- Customer: `/` and `/customer`

## Notes
- Session cookies are marked `secure` when `NODE_ENV=production`.
- If you change DB credentials in compose, you may need to reset the volume.
