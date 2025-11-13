## Social — Nightlife MVP

This repository contains the Social nightlife MVP: a unified, mobile-first Progressive Web App for guests and an admin dashboard for venue staff. The stack is **Next.js 16 (App Router)** with Tailwind CSS 4 design tokens and **Supabase** for authentication, data, and realtime features.

The application now supports English and Spanish throughout the guest and admin experiences. Toggle the language from any header via the ENG/ES control.

### Internationalisation

- Localised routes live under `src/app/[locale]/…`; every page/layout must be defined within that segment so translations resolve correctly.
- Message catalogues reside in `src/i18n/messages/{locale}.json`. Keep keys stable, add new copy to both languages, and avoid reusing keys for different phrases.
- Client components access copy via `useTranslations("<namespace>")`. Server components should use `getServerTranslations({locale, namespace})`.
- For navigation, import `Link`, `useRouter`, and `usePathname` from `@/i18n` to ensure locale-aware URLs.
- Middleware (`middleware.ts`) enforces locale prefixes and persists preferences via cookies. Routes that should stay unprefixed can be handled with rewrites in `next.config.ts`.

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

## Deployment

Ready to deploy? See [DEPLOYMENT.md](./DEPLOYMENT.md) for a complete guide to deploying to Vercel.

**Quick Start:**
1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in [Vercel](https://vercel.com/new)
3. Add environment variables (see DEPLOYMENT.md)
4. Deploy! 🚀

The project includes:
- ✅ `vercel.json` configuration
- ✅ Production build tested and working
- ✅ Environment variables documented
- ✅ Deployment guide with step-by-step instructions

## Project Structure

```
src/
  app/            // Next.js App Router routes and layouts
  lib/            // Environment parsing, Supabase helpers, utilities
  components/     // UI building blocks (auth, onboarding, etc.)
public/           // Static assets, icons, service worker
supabase/
  migrations/     // SQL schema and policy definitions
```

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

4. Populate the `venues` table with at least one venue and grant staff/admin access via `venue_memberships` so they can see the dashboard. If you are configuring an existing project via the Supabase dashboard instead of the CLI, follow `docs/supabase-manual-setup.md` for the exact SQL snippets.

## Progressive Web App

- The installable manifest lives in `src/app/manifest.ts` and the custom service worker in `public/sw.js`.
- Icons are under `public/icons/`; replace them with venue-branded PNG/SVG assets before launch.
- The `PWAProvider` automatically registers the service worker and surfaces an install banner when `beforeinstallprompt` fires.
- To test the install flow:
  1. Run `npm run dev`
  2. Open Chrome DevTools → Lighthouse → PWA to verify installability
  3. Trigger “Add to Home Screen” on mobile (or the Chrome install menu on desktop)

Avoid running the app over `http` in production; enable HTTPS (or `vercel dev --https`) so the service worker can register.

## Offers Feature

- **Admin experience**: Staff manage offers from `/admin/offers`, with fields for scheduling (start/end), promo codes, priority ordering, call-to-action links, and hero imagery. Each edit revalidates the admin and guest surfaces.
- **Guest experience**: Active offers appear at the top of `/app`. Guests tap “Save offer” to log a redemption and receive an in-app toast confirmation that surfaces any promo code tied to the offer.
- **Redemption tracking**: Every save inserts into `offer_redemptions`. Admins see the latest five saves per offer and can mark them as redeemed, which timestamps `redeemed_at` for downstream reporting.
- **Notifications**: This MVP relies on real-time toasts within the guest app plus inline success banners in the admin UI—no email/SMS is dispatched.
- **Testing strategy**:
  - **Manual flow**: create an offer, verify appearance in `/app`, save it as a guest (confirm toast + promo code), then mark it redeemed in `/admin/offers`.
  - **Future unit coverage**: stub Supabase client to exercise `saveOfferAction`, `deleteOfferAction`, and `acceptOfferAction` validation branches (start/end windows, duplicate saves).
  - **Integration**: when E2E harness is available, script a scenario that seeds an offer, performs a guest save, and asserts redemption state in the admin dashboard.

## Admin Blocking

- **Staff controls**: The Guests tab now supports timed blocks (1h / 24h / 7d / permanent) plus an optional reason. Blocking a guest clears their active venue sessions immediately.
- **Guest experience**: Blocked users are redirected to a dedicated notice across all `/app` tabs showing the reason and unblock time. They cannot browse the deck, send vibes, or submit song requests until the block expires or is removed.
- **Visibility**: Blocked guests are removed from the connect deck and active attendee list, but existing vibes/matches remain accessible. Other guests see a “Blocked” badge beside those users within Matches so they can still respond appropriately.
- **Enforcement**: `ensureActiveVenueSession` refuses new sessions while a profile is blocked, keeping attendance data clean and preventing re-entry during the block window.
