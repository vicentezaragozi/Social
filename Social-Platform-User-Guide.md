# Social Platform — User Guide & Operations Manual

## Overview

Social is a nightlife platform that connects guests at venues. Guests use a Progressive Web App (PWA) to connect, match, request songs, and view offers. Venue admins use a dashboard to manage guests, view analytics, handle song requests, and create offers.

---

## Part 1: Testing as a Regular User

### Creating Test Accounts

Use email aliasing to create multiple test accounts with one email:

**Step-by-Step Process:**

1. **Use your email with plus aliases:**
   - `youremail+guest1@gmail.com`
   - `youremail+guest2@gmail.com`
   - `youremail+guest3@gmail.com`

2. **Sign up:**
   - Go to the app homepage
   - Click "Sign In" or "Get Started"
   - Enter `youremail+guest1@gmail.com`
   - Check your inbox for the magic link
   - Click the link to sign in

3. **Complete onboarding:**
   - Enter display name
   - Upload profile photo
   - Add bio (optional)
   - Set age (18+)
   - Choose privacy settings

4. **Repeat for additional test accounts** using different plus aliases.

### Using the Guest App

#### Main Features:

**1. Connect Feed (`/app`)**
- Browse active guests at the venue
- Like or send invites
- View profiles (name, photo, bio)
- See venue hosts/admins if enabled

**2. Matches (`/matches`)**
- View mutual matches
- Access WhatsApp links if provided
- See match history

**3. Song Requests (`/requests`)**
- Submit song requests
- Add artist name and notes
- Track request status (pending/completed/cancelled)

**4. Offers (`/offers`)**
- View active venue offers
- Redeem promo codes
- See special deals and events

**5. Profile (`/profile`)**
- Edit display name, photo, bio
- Toggle privacy
- View account settings

### PWA Installation

1. Open the app in a mobile browser (iOS Safari or Android Chrome)
2. Look for "Add to Home Screen" or "Install App"
3. Tap to install
4. The app opens like a native app
5. Works offline for basic navigation (full features require internet)

### Magic Link Authentication

- Enter your email on the sign-in page
- Check your inbox for the magic link email
- Click the link to sign in automatically
- No password required
- Links expire after a set time (typically 1 hour)

---

## Part 2: Testing as an Admin

### Requesting Admin Access

1. Contact the platform administrator
2. Provide:
   - Venue name
   - Your email address
   - Your name/display name
3. The administrator will:
   - Create the venue (if new)
   - Create your admin account
   - Send you login credentials

### Admin Login

1. Go to `/sign-in/admin`
2. Enter your admin email
3. Enter the password provided
4. Click "Sign In"
5. Complete onboarding (first time only):
   - Upload profile photo
   - Set display name
   - Configure session settings

### Admin Dashboard Features

#### Dashboard (`/admin`)

- **Current attendance:** Active guests right now
- **Matches today:** Number of matches made today
- **Song requests:** Pending requests today
- **New customers:** New signups today
- **Attendance charts:** 12h, 24h, 7-day views

#### Guest Management (`/admin/users`)

- View all guests
- See active/inactive status
- View profiles
- Block/unblock users
- View guest activity

#### Song Queue (`/admin/requests`)

- View all song requests
- Mark requests as completed
- Filter by status
- See request details (song, artist, notes, timestamp)

#### Offers Management (`/admin/offers`)

- Create promotional offers
- Set title, description, image
- Add CTA button with link
- Set start/end dates
- Set priority
- Activate/deactivate offers

#### Settings (`/admin/settings`)

- **Venue information:** Name, location, description
- **Venue media:** Logo, cover image
- **Contact info:** Phone, email, website
- **Social links:** Instagram, Twitter, Facebook
- **Session configuration:** Session name, duration, type
- **Admin profile:** Photo, display name

### Switching Between Admin and Guest Views

- From admin dashboard: Click "Go to App" in the header
- From guest app: Sign out and sign in as admin, or use the admin link if available

---

## Part 3: Onboarding New Venues (Production Use)

When a venue wants to use Social, follow these steps:

### Step 1: Gather Venue Information

Collect the following information from the venue contact:

- **Venue name** (e.g., "Grand Hotel Madrid")
- **Venue slug** (e.g., "grand-hotel-madrid" — lowercase, hyphens only)
- **Location** (e.g., "Madrid, Spain")
- **Timezone** (e.g., "Europe/Madrid")
- **Contact email**
- **Contact phone** (optional)
- **Website URL** (optional)
- **Address** (optional)
- **Description** (optional)
- **Admin email** (from venue contact)
- **Admin display name** (e.g., "Hotel Manager")
- **Admin password** (you'll set this)

### Step 2: Create the Venue in Supabase

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the following SQL script
3. Replace all `{{PLACEHOLDER}}` values with actual venue information:

```sql
-- ============================================================================
-- CREATE NEW VENUE SCRIPT
-- Use this script to create a new venue when a hotel/venue wants to use Social
-- 
-- INSTRUCTIONS:
-- 1. Replace all {{PLACEHOLDER}} values below with actual venue information
-- 2. Run this script in Supabase SQL Editor
-- 3. After running, note the venue_id from the output - you'll need it for admin creation
-- ============================================================================

DO $$
DECLARE
  v_venue_id uuid;
  v_slug text := '{{VENUE_SLUG}}';  -- e.g., 'grand-hotel-madrid' (lowercase, no spaces, hyphens only)
  v_name text := '{{VENUE_NAME}}';  -- e.g., 'Grand Hotel Madrid'
  v_location text := '{{VENUE_LOCATION}}';  -- e.g., 'Madrid, Spain'
  v_timezone text := '{{VENUE_TIMEZONE}}';  -- e.g., 'Europe/Madrid' or 'America/New_York'
  v_description text := '{{VENUE_DESCRIPTION}}';  -- Optional: Brief description
  v_address text := '{{VENUE_ADDRESS}}';  -- Optional: Full address
  v_phone text := '{{VENUE_PHONE}}';  -- Optional: Contact phone
  v_email text := '{{VENUE_EMAIL}}';  -- Optional: Contact email
  v_website text := '{{VENUE_WEBSITE}}';  -- Optional: Website URL
  v_session_name text := '{{SESSION_NAME}}';  -- e.g., 'Friday Night Session' or 'Weekend Event'
  v_session_duration_hours integer := 24;  -- Default 24 hours, adjust as needed (1-168 hours)
BEGIN
  -- Validate slug format (lowercase, alphanumeric and hyphens only)
  IF v_slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.';
  END IF;

  -- Check if slug already exists
  IF EXISTS (SELECT 1 FROM public.venues WHERE slug = v_slug) THEN
    RAISE EXCEPTION 'Venue slug already exists. Choose a different slug.';
  END IF;

  -- Create the venue
  INSERT INTO public.venues (
    slug,
    name,
    location,
    timezone,
    description,
    address,
    phone_number,
    email,
    website_url
  )
  VALUES (
    v_slug,
    v_name,
    v_location,
    COALESCE(v_timezone, 'UTC'),
    NULLIF(v_description, '{{VENUE_DESCRIPTION}}'),
    NULLIF(v_address, '{{VENUE_ADDRESS}}'),
    NULLIF(v_phone, '{{VENUE_PHONE}}'),
    NULLIF(v_email, '{{VENUE_EMAIL}}'),
    NULLIF(v_website, '{{VENUE_WEBSITE}}')
  )
  RETURNING id INTO v_venue_id;

  RAISE NOTICE '✓ Venue created with ID: %', v_venue_id;

  -- Create default active session metadata for the venue
  INSERT INTO public.session_metadata (
    venue_id,
    session_name,
    session_description,
    session_type,
    duration_hours,
    is_active,
    start_time,
    end_time
  )
  VALUES (
    v_venue_id,
    COALESCE(v_session_name, 'Default Session'),
    'Active session for ' || v_name,
    'event',
    v_session_duration_hours,
    true,
    now(),
    now() + (v_session_duration_hours || ' hours')::interval
  );

  RAISE NOTICE '✓ Session metadata created for venue';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VENUE CREATION COMPLETE!';
  RAISE NOTICE 'Venue ID: %', v_venue_id;
  RAISE NOTICE 'Venue Slug: %', v_slug;
  RAISE NOTICE 'Venue Name: %', v_name;
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run the create-admin script with this venue_id';
  RAISE NOTICE '========================================';

END $$;
```

**Example values to replace:**
- `{{VENUE_SLUG}}` → `'grand-hotel-madrid'`
- `{{VENUE_NAME}}` → `'Grand Hotel Madrid'`
- `{{VENUE_LOCATION}}` → `'Madrid, Spain'`
- `{{VENUE_TIMEZONE}}` → `'Europe/Madrid'`
- `{{VENUE_DESCRIPTION}}` → `'Luxury hotel in the heart of Madrid'` (or leave as placeholder if not needed)
- `{{VENUE_ADDRESS}}` → `'123 Calle Gran Via, Madrid, Spain'` (or leave as placeholder if not needed)
- `{{VENUE_PHONE}}` → `'+34 123 456 789'` (or leave as placeholder if not needed)
- `{{VENUE_EMAIL}}` → `'info@grandhotelmadrid.com'` (or leave as placeholder if not needed)
- `{{VENUE_WEBSITE}}` → `'https://grandhotelmadrid.com'` (or leave as placeholder if not needed)
- `{{SESSION_NAME}}` → `'Weekend Night Session'`

4. Run the script
5. **Note the `venue_id` from the output** (UUID) — you'll need this for the next step

> **Note:** The script will create both the venue and a default active session for that venue.

### Step 3: Create Auth User for Admin

1. In **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** → **"Create new user"**
3. Enter the admin email
4. Set a temporary password (admin will change it later)
5. Click **"Create User"**
6. Note the **User ID** (UUID) — this will be the same as the profile ID

### Step 4: Generate Password Hash

You need to generate a bcrypt hash for the admin password. Use one of these methods:

**Option A — Using Node.js:**

```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('YourSecurePassword123', 10);
console.log(hash);
```

**Option B — Using Online Tool:**

- Search for "bcrypt hash generator" online
- Enter your password
- Set rounds to 10
- Copy the generated hash

> **Important:** Keep the password secure and share it with the venue admin through a secure channel.

### Step 5: Create Admin Account

1. In **Supabase SQL Editor**
2. Copy and paste the following SQL script
3. Replace all `{{PLACEHOLDER}}` values:

```sql
-- ============================================================================
-- CREATE VENUE ADMIN SCRIPT
-- Use this script to create an admin user for a specific venue
-- 
-- INSTRUCTIONS:
-- 1. First, ensure the venue exists (run create-new-venue.sql if needed)
-- 2. Get the venue_id from the venues table or from the venue creation output
-- 3. Replace all {{PLACEHOLDER}} values below
-- 4. Generate a bcrypt password hash for the password (see notes below)
-- 5. Run this script in Supabase SQL Editor
--
-- PASSWORD HASH GENERATION:
-- You can generate a bcrypt hash using Node.js:
--   const bcrypt = require('bcryptjs');
--   const hash = await bcrypt.hash('YourPassword123', 10);
--   console.log(hash);
-- Or use an online bcrypt generator (ensure it uses 10 rounds)
-- ============================================================================

DO $$
DECLARE
  v_venue_id uuid := '{{VENUE_ID}}';  -- UUID from venues table
  v_admin_email text := '{{ADMIN_EMAIL}}';  -- e.g., 'manager@hotel.com'
  v_password_hash text := '{{PASSWORD_HASH}}';  -- Bcrypt hash (10 rounds)
  v_display_name text := '{{ADMIN_DISPLAY_NAME}}';  -- e.g., 'Hotel Manager'
  v_user_id uuid;
  v_profile_id uuid;
BEGIN
  -- Validate venue exists
  IF NOT EXISTS (SELECT 1 FROM public.venues WHERE id = v_venue_id) THEN
    RAISE EXCEPTION 'Venue with ID % does not exist. Create the venue first.', v_venue_id;
  END IF;

  -- Check if auth user already exists with this email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = LOWER(v_admin_email);

  IF v_user_id IS NULL THEN
    -- Create auth user (requires Supabase Auth API or manual creation)
    -- For now, we'll raise an error and guide the user
    RAISE EXCEPTION 'Auth user with email % does not exist. Please create the user first in Supabase Dashboard > Authentication > Users, then run this script again.', v_admin_email;
  END IF;

  v_profile_id := v_user_id;  -- Profile ID matches user ID

  RAISE NOTICE 'Using venue ID: %', v_venue_id;
  RAISE NOTICE 'Using user ID: %', v_user_id;
  RAISE NOTICE 'Using email: %', v_admin_email;

  -- Create or update profile
  INSERT INTO public.profiles (
    id,
    display_name,
    is_private,
    is_deactivated
  )
  VALUES (
    v_profile_id,
    v_display_name,
    false,
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    is_private = false,
    is_deactivated = false;

  RAISE NOTICE '✓ Profile created/updated';

  -- Create or update admin credentials
  INSERT INTO public.admin_credentials (
    profile_id,
    email,
    password_hash,
    is_active
  )
  VALUES (
    v_profile_id,
    LOWER(v_admin_email),
    v_password_hash,
    true
  )
  ON CONFLICT (email) DO UPDATE
  SET
    profile_id = EXCLUDED.profile_id,
    password_hash = EXCLUDED.password_hash,
    is_active = true;

  RAISE NOTICE '✓ Admin credentials created/updated';

  -- Create or update venue membership with admin role
  INSERT INTO public.venue_memberships (
    user_id,
    venue_id,
    role,
    show_in_guest_feed
  )
  VALUES (
    v_user_id,
    v_venue_id,
    'admin',
    false
  )
  ON CONFLICT (user_id, venue_id) DO UPDATE
  SET role = 'admin';

  RAISE NOTICE '✓ Venue membership created/updated';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ADMIN CREATION COMPLETE!';
  RAISE NOTICE 'Email: %', v_admin_email;
  RAISE NOTICE 'Display Name: %', v_display_name;
  RAISE NOTICE 'Venue ID: %', v_venue_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Admin can now sign in at: /sign-in/admin';
  RAISE NOTICE '========================================';

END $$;
```

**Example values to replace:**
- `{{VENUE_ID}}` → `'PASTE_VENUE_ID_FROM_STEP_2'` (the UUID from Step 2 output)
- `{{ADMIN_EMAIL}}` → `'manager@grandhotelmadrid.com'`
- `{{PASSWORD_HASH}}` → `'PASTE_BCRYPT_HASH_FROM_STEP_4'` (the bcrypt hash from Step 4)
- `{{ADMIN_DISPLAY_NAME}}` → `'Hotel Manager'`

4. Run the script
5. Verify success messages in the output

### Step 6: Communicate Credentials to Venue

Send the venue contact the following information:

- **Admin login URL:** `https://yourapp.com/sign-in/admin`
- **Admin email:** (the email you used)
- **Admin password:** (the password you hashed)
- **Instructions:**
  1. Go to the login URL
  2. Enter email and password
  3. Complete onboarding (upload photo, set display name)
  4. Start managing the venue

> **Best Practice:** Send credentials through encrypted email or a secure communication channel.

### Step 7: Venue Admin Setup

The venue admin should:

1. **Log in** with provided credentials
2. **Complete onboarding:**
   - Upload profile photo
   - Set display name
   - Configure session settings (name, duration)
3. **Customize venue:**
   - Upload venue logo and cover image
   - Add venue description
   - Add contact information
   - Add social media links
4. **Start using the dashboard:**
   - Monitor attendance
   - Handle song requests
   - Create offers
   - Manage guests

---

## Part 4: Quick Reference

### For Regular Users

- **Sign up:** Use email with magic link
- **Test multiple accounts:** Use `email+alias@gmail.com`
- **Install PWA:** Add to home screen from mobile browser
- **Main features:** Connect, Matches, Song Requests, Offers, Profile

### For Admins

- **Login:** `/sign-in/admin` with email and password
- **Dashboard:** View analytics and KPIs
- **Manage:** Guests, Song Requests, Offers, Settings
- **Switch views:** Use "Go to App" to see guest view

### For Platform Administrators

- **Create venue:** Use the SQL script in Part 3, Step 2 (create-new-venue.sql)
- **Create admin:** Use the SQL script in Part 3, Step 5 (create-venue-admin.sql) after creating auth user
- **Password hashing:** Use bcrypt (10 rounds)
- **Communication:** Send login credentials securely to venue contact

---

## Part 5: Troubleshooting

### Common Issues

#### Magic link not received

- Check spam folder
- Verify email address
- Request a new link
- Check Supabase email settings

#### Admin can't log in

- Verify email and password are correct
- Check `admin_credentials` table for the email
- Verify `venue_memberships` has admin role
- Ensure profile exists

#### Venue not appearing

- Verify venue was created in `venues` table
- Check `session_metadata` exists and `is_active = true`
- Verify venue slug is correct

#### PWA not installing

- Use a supported browser (Chrome on Android, Safari on iOS)
- Ensure site is served over HTTPS
- Check `manifest.json` configuration

---

## Part 6: Security Notes

- **Admin passwords:** Use strong passwords and bcrypt hashing
- **Magic links:** Expire after 1 hour
- **Admin access:** Only grant to trusted venue staff
- **Data privacy:** Follow GDPR/privacy regulations
- **Credentials:** Send securely (encrypted email or secure channel)

---

## Part 7: Support

For technical issues or questions:

- Check Supabase logs in **Dashboard → Logs**
- Review SQL script outputs for error messages
- Verify database tables and relationships
- Contact the development team if needed

---

## Conclusion

This guide covers testing, daily use, and onboarding new venues. The SQL scripts automate venue and admin creation. Keep credentials secure and follow best practices for password management.

---

*Document Version: 1.0*  
*Last Updated: 2024*

