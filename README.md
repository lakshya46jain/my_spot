# MySpot

MySpot is a full-stack web app for discovering, reviewing, and sharing study-friendly places such as cafes, libraries, and campus spaces. It helps users compare locations based on atmosphere, convenience, and community feedback, while also giving admins tools to moderate content and manage the platform.

## What the project does

MySpot lets users:

- browse study spots from the community
- search spots by name or nearby location
- save favorite spots
- create an account or continue as a guest
- add new spots for review
- upload spot images
- leave ratings and written reviews
- report inaccurate or inappropriate content
- manage their profile and account details

Admins and moderators can:

- review pending spots
- manage users and roles
- moderate reported spots and reviews
- update spot statuses
- view dashboard metrics and analytics

## Tech stack

### Frontend

- React 19
- TypeScript
- TanStack Start
- TanStack Router
- Tailwind CSS 4
- Radix UI
- Framer Motion
- Recharts

### Backend and services

- TanStack Start server functions
- MySQL with `mysql2`
- Zod for input validation
- `bcryptjs` for password hashing
- Firebase Storage via `firebase-admin` for image uploads
- Google Maps Places/Geocoding for location search and autocomplete

## Repository structure

```text
my_spot/
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── reset_schema.sql
├── documentation/
│   └── project PDFs and database design deliverables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── server/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Main features in the current app

- Landing page with guest access, sign in, and registration
- Explore page with keyword search and nearby-location search
- Spot detail pages with ratings, reviews, media, and hours
- Add-spot flow with location, operating hours, and media uploads
- Favorites page for saved study spots
- Profile page for updating account details
- Admin dashboard with moderation and analytics views
- Report flows for spots and reviews

## Database design

The app uses a relational MySQL schema with tables for:

- `users`
- `roles`
- `spots`
- `reviews`
- `favorites`
- `attribute_menu`
- `spot_attributes`
- `spot_hours`
- `spot_media`
- `content_report`

These tables support authentication, saved spots, user-submitted content, operating hours, uploaded media, and admin moderation workflows.

## Environment variables

Create `frontend/.env.local` and add the variables your setup needs:

```env
MYSQL_PUBLIC_URL=mysql://username:password@localhost:3306/myspot

VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Variable notes

- `MYSQL_PUBLIC_URL` is required for all database-backed functionality.
- `VITE_GOOGLE_MAPS_API_KEY` is needed for location autocomplete and nearby search.
- Firebase variables are required for server-side image uploads and media cleanup.
- Keep `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` secret.
- Keep `.env.local` out of version control.

## Local setup

### 1. Install prerequisites

Make sure you have:

- Node.js 20+
- npm
- MySQL 8+ or a Railway MySQL database
- a Firebase project with Storage enabled
- a Google Maps API key with the required APIs enabled

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Set up the database

You have two SQL entry points in this repo:

- `database/schema.sql` creates a local `myspot` schema
- `database/reset_schema.sql` recreates a `railway` schema

Important: `database/seed.sql` currently starts with `USE myspot;`, so your schema name and your `MYSQL_PUBLIC_URL` must match the script you choose to run.

#### Option A: local MySQL using `myspot`

From the project root:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p myspot < database/seed.sql
```

Then set:

```env
MYSQL_PUBLIC_URL=mysql://root:yourpassword@localhost:3306/myspot
```

#### Option B: Railway-style setup

Use `database/reset_schema.sql` if you want to rebuild a `railway` schema. If you also want the sample seed data, either:

- update the first line of `database/seed.sql` to use the same schema name, or
- create/use a `myspot` schema instead and point `MYSQL_PUBLIC_URL` there

### 4. Configure Google Maps

Enable these APIs for your Google Maps key:

- Maps JavaScript API
- Places API
- Geocoding API

### 5. Configure Firebase Storage

Create a Firebase service account and add its credentials to `frontend/.env.local`. The app uses `firebase-admin` on the server to upload and delete spot images.

### 6. Start the app

From `frontend/`:

```bash
npm run dev
```

The Vite dev server is configured to run on:

```text
http://localhost:8080
```

## Available frontend scripts

From `frontend/`:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## How authentication works

- Registered users are stored in MySQL
- Passwords are hashed with `bcryptjs`
- Client auth state is stored in local storage
- Guests can browse without creating an account
- Admin access is controlled through roles in the database

## Deployment notes

This project is structured as a TanStack Start app inside `frontend/`. For production deployment, make sure your host provides:

- Node support for the frontend app
- all environment variables listed above
- access to the MySQL database
- Firebase service account credentials
- a valid Google Maps API key

## Documentation

The `documentation/` folder includes project deliverables such as:

- project proposal
- entity relationship diagram
- normalized relational schema
- database initialization documentation
- connectivity and UI operation documentation

## Team

- Lakshya Jain
- Jenna Baker
- Liam Erickson
- Tia Mehta

## Current notes

- The README previously referenced `database/README.md`, but that file is not present in the repository.
- The SQL scripts currently use two schema names, `myspot` and `railway`. Keeping your schema name consistent across SQL scripts and `MYSQL_PUBLIC_URL` will save setup time.
