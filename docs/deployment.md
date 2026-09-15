# Deployment and Supabase setup

## Supabase

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. In Project Settings, copy the project URL and publishable key.
4. Create `.env.local` from `.env.example` and fill:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_ALLOWED_EMAIL=your-email@example.com
```

The app uses Supabase Auth. When these environment variables exist, users must sign in before reading or writing yarns, patterns, projects, and images. The UI only allows `VITE_ALLOWED_EMAIL` to sign in. Row Level Security in `supabase/schema.sql` also restricts database rows and private Storage objects to `fitz.astra@gmail.com`.

Photos are compressed in the browser before upload, stored in the private `craft-images` Supabase Storage bucket, and referenced from the database by Storage path. The bucket is configured by `supabase/schema.sql` with a 1 MB file limit for compressed images.

## Vercel

1. Push this project to GitHub.
2. In Vercel, create a new project and import `ArKr1223/Crochet`.
3. Keep the framework preset as Vite.
4. Add Environment Variables for Production, Preview, and Development:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_ALLOWED_EMAIL`
5. Deploy.

Preview deployment URLs need Preview environment variables. If `VITE_ALLOWED_EMAIL` is Production-only, Preview URLs will not enforce the email allowlist. After adding or changing environment variables in Vercel, redeploy the project. A previously built deployment keeps the old environment values. Production builds without Supabase environment variables show a configuration warning instead of the local demo data.

Vercel builds with `npm run build` and serves the `dist` folder. `vercel.json` includes a rewrite to `index.html` so the app behaves like a single-page app if routes are added later.

## GitHub Pages

GitHub Pages is optional because the app is deployed on Vercel. The workflow is manual-only to avoid deployment failure emails on every push.

1. Push this project to a GitHub repository.
2. In the repository, open Settings > Secrets and variables > Actions.
3. Add repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_ALLOWED_EMAIL`
4. Open Settings > Pages and set Source to GitHub Actions.
5. Push to `main` or run the `Deploy to GitHub Pages` workflow manually.

The workflow passes the Supabase values into `npm run build`, so the deployed app connects to the same database as local development.
