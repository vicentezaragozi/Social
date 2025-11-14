# Vercel Deployment Guide

This guide will help you deploy your Social platform to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) if you don't have one
2. **GitHub/GitLab/Bitbucket Repository**: Your code should be in a Git repository
3. **Supabase Project**: Your Supabase project should be set up and running
4. **Environment Variables**: Collect all required environment variables (see below)

## Step 1: Prepare Your Repository

1. Make sure your code is committed and pushed to your Git repository:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

## Step 2: Create Vercel Project

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel will auto-detect Next.js settings

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No**
   - Project name? (default is fine)
   - Directory? `./`
   - Override settings? **No**

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 3: Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables for **Production**, **Preview**, and **Development**:

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret!) | `eyJhbGc...` |
| `SUPABASE_DB_PASSWORD` | Database password (if needed for migrations) | `your-password` |
| `NEXT_PUBLIC_APP_URL` | **Your production app URL** ⚠️ **CRITICAL**: Must be your production URL, not localhost! | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_DJ_WHATSAPP_NUMBER` | WhatsApp number for song requests (optional) | `+1234567890` |

### How to Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Step 4: Configure Project Settings

In Vercel dashboard, go to **Settings** → **General**:

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `.` (the project root - **NOT** `src`)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)
- **Node.js Version**: 18.x or 20.x (recommended)

**Important**: When asked for "Root Directory" or "Source Directory", select `.` (dot) or leave it empty. **Do NOT** select `src` - your Next.js project root is where `package.json`, `next.config.ts`, and `vercel.json` are located.

## Step 5: Deploy Database Migrations

Your Supabase migrations are in `supabase/migrations/`. Run them using Supabase CLI:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push
```

**Note**: Your project ref is in your Supabase project URL: `https://xxxxx.supabase.co` → `xxxxx` is your project ref.

## Step 6: Configure Supabase Storage

1. Go to Supabase Dashboard → **Storage**
2. Create a bucket named `id-photos` (if not exists)
3. Set it as **Private**
4. Set up storage policies (see README.md for example policies)

## Step 7: Set Up Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain

## Step 8: Deploy

### Via Dashboard:
- Push to your main branch to trigger automatic deployment
- Or manually trigger from **Deployments** tab

### Via CLI:
```bash
vercel --prod
```

## Step 9: Configure Supabase Redirect URLs

**⚠️ CRITICAL**: You must configure Supabase to allow your production redirect URLs:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your production URLs to **Redirect URLs**:
   - `https://your-app.vercel.app/en/auth/callback`
   - `https://your-app.vercel.app/es/auth/callback`
   - Or use wildcard: `https://your-app.vercel.app/*/auth/callback`
4. Add to **Site URL**: `https://your-app.vercel.app`
5. Save changes

**Without this, magic links will fail in production!**

## Step 10: Verify Deployment

After deployment completes:

1. ✅ Check your live site loads correctly
2. ✅ **Test authentication flow** - Request magic link and verify it goes to production URL, not localhost
3. ✅ Verify locale routing (`/en` and `/es`)
4. ✅ Test PWA installation
5. ✅ Check admin dashboard access
6. ✅ Verify Supabase connections
7. ✅ **Test magic link email** - Click the link and verify it redirects to production

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `package.json` scripts are correct
- Check Node.js version compatibility
- **Verify Root Directory is set to `.` (not `src`)**

### Manifest.webmanifest Warning

If you see: `WARNING: Unable to find source file for page /manifest.webmanifest/route`

- This is a **harmless warning** - Next.js automatically generates the manifest route from `src/app/manifest.ts`
- The app will work correctly despite this warning
- You can safely ignore it

### Middleware.js / Middleware.js.nft.json Errors

If you see errors like:
- `Error: ENOENT: no such file or directory, open '.next/server/middleware.js.nft.json'`
- `Error: ENOENT: no such file or directory, lstat '.next/server/middleware.js'`

**Root Cause**: This is a known compatibility issue between Next.js 16.x and Vercel's function bundling system. The build completes successfully, but Vercel's post-processing can't find middleware files in some cases.

**✅ Verified as of November 2025**: 
- Tested with Next.js 16.0.3 (latest stable as of Nov 2025)
- The workaround fix is compatible and still needed
- Vercel's current deployment system may still encounter this issue
- Project has been updated to Next.js 16.0.3 for better compatibility

**✅ FIXED**: The build command now automatically:
1. Creates the missing `.nft.json` file after build
2. Copies `middleware.js` to the server directory if needed
3. Ensures all required files exist before Vercel's bundling step

**If you still see this error:**
1. ✅ **Verify Root Directory**: Settings → General → Root Directory should be `.` (not `src`)
2. ✅ **Clear Build Cache**: Settings → General → Clear Build Cache, then redeploy
3. ✅ **Check Build Logs**: The build should show "Created middleware.js in server directory"
4. ✅ **Verify Package.json**: Ensure the `build` script includes the inline fix
5. ⚠️ **If deployment still fails**: This error may be non-critical - check if your deployment URL actually works despite the error

**Note**: The `src/proxy.ts` file exists but is unused. If issues persist, consider removing it or moving its logic into the main `middleware.ts`.

### Environment Variables Not Working

- Ensure variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Magic Links Redirect to Localhost

If magic links redirect to `http://localhost:3000` instead of your production URL:

1. **Check `NEXT_PUBLIC_APP_URL` in Vercel**:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_APP_URL` is set to your production URL (e.g., `https://your-app.vercel.app`)
   - **NOT** `http://localhost:3000`
   - Ensure it's set for **Production** environment
   - Redeploy after updating

2. **Configure Supabase Redirect URLs**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your production callback URLs:
     - `https://your-app.vercel.app/en/auth/callback`
     - `https://your-app.vercel.app/es/auth/callback`
   - Save changes

3. **Verify Environment Variable**:
   - The code uses `env.NEXT_PUBLIC_APP_URL` to construct callback URLs
   - This must match your production domain exactly

### Supabase Connection Issues

- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Ensure Row Level Security (RLS) policies allow access
- Check CORS settings in Supabase

### Locale Routing Issues

- Verify middleware is configured correctly
- Check `i18n/routing.ts` locale configuration
- Ensure locale cookies are being set

### PWA Not Working

- Ensure site is served over HTTPS (Vercel does this automatically)
- Check manifest and service worker files
- Verify icons exist in `public/icons/`

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Storage buckets created and configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Production URL updated in environment variables
- [ ] Test all critical user flows
- [ ] Monitor error logs
- [ ] Set up monitoring/alerts

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches (creates preview URLs)

To disable auto-deployment, go to **Settings** → **Git** and configure as needed.

## Environment-Specific Configurations

You can set different environment variables for:
- **Production**: Your live site
- **Preview**: Preview deployments from PRs/branches
- **Development**: Local development with `vercel dev`

Update variables in **Settings** → **Environment Variables** and specify which environments each applies to.

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)

