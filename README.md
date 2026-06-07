# GymTrack Pro

Fast, mobile-first workout tracking PWA with offline sync.

## Features

- Email/password + Google OAuth authentication
- 300+ system exercises with search and filters
- Custom exercise creation
- Workout templates
- Active workout tracking with QuickLogPad (sub-3-second set logging)
- Full offline workout logging with auto-sync
- Workout history and progress analytics
- Personal records and volume charts
- Installable PWA

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, RLS)
- Zustand + Dexie (offline sync)
- Recharts + Serwist (PWA)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration: `supabase/migrations/001_initial_schema.sql`
3. Run the seed: `supabase/seed.sql`
4. Enable Google OAuth in Authentication > Providers
5. Add redirect URL: `http://localhost:3000/auth/callback`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy

- **Frontend**: Deploy to Vercel, add env vars
- **Backend**: Supabase handles database and auth
- Update OAuth redirect URLs to your production domain

## Project Structure

```
src/
├── app/           # Pages and routes
├── components/    # UI components
├── lib/           # Supabase, analytics, offline sync
├── stores/        # Zustand workout store
supabase/
├── migrations/    # Database schema
└── seed.sql       # Exercise seed data
```

## PWA

The app is installable on iOS Safari and Android Chrome. Serwist handles service worker caching. Offline workout data syncs automatically when back online.

Build for production:

```bash
npm run build
npm start
```
