## Social — Nightlife MVP

This repository contains the Social nightlife MVP: a unified, mobile-first Progressive Web App for guests and an admin dashboard for venue staff. The stack is **Next.js 16 (App Router)** with Tailwind CSS 4 design tokens and **Supabase** for authentication, data, and realtime features.

All UI is built in English for now and follows a dark, neon-inspired aesthetic with no gradients, optimised for on-device installs via PWA.

## Getting Started

1. Duplicate `env.example` into `.env.local` and populate the Supabase credentials:

```bash
cp env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for secure server actions (keep secret) |
| `SUPABASE_DB_PASSWORD` | Password for migrations or external tooling |
| `NEXT_PUBLIC_APP_URL` | Publicly accessible app URL (used for metadata/PWA) |
| `NEXT_PUBLIC_DJ_WHATSAPP_NUMBER` | Venue WhatsApp number used for song requests |

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server |
| `npm run lint` | Run ESLint across the project |

## Project Structure

```
src/
  app/            // Next.js App Router routes and layouts
  lib/            // Environment parsing, Supabase helpers, utilities
  components/     // UI building blocks (auth, onboarding, etc.)
public/           // Static assets and PWA icons (in progress)
supabase/
  migrations/     // SQL schema and policy definitions
```

Upcoming tasks will introduce the Supabase schema, guest flows, admin dashboard, and the full PWA configuration.

## Supabase Setup

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and authenticate.
2. Create a new project (or link to an existing one) and run the initial migration:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

3. Create a Storage bucket named `id-photos` (private) and ensure Storage policies allow users to upload their own files and admins to read them. Example policy:

```sql
create policy "Users manage their ID photos"
on storage.objects for all
using (
  bucket_id = 'id-photos'
  and auth.uid() = owner
)
with check (
  bucket_id = 'id-photos'
  and auth.uid() = owner
);
```

4. Populate the `venues` table with at least one venue and grant staff/admin access via `venue_memberships` so they can see the dashboard.
