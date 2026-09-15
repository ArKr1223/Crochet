# GitHub Pages and Supabase setup

## Supabase

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. In Project Settings, copy the project URL and publishable key.
4. Create `.env.local` from `.env.example` and fill:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The app uses Supabase Auth. When these environment variables exist, users must sign in before reading or writing yarns, patterns, and projects. Row Level Security in `supabase/schema.sql` keeps each user's rows private.

## GitHub Pages

1. Push this project to a GitHub repository.
2. In the repository, open Settings > Secrets and variables > Actions.
3. Add repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Open Settings > Pages and set Source to GitHub Actions.
5. Push to `main` or run the `Deploy to GitHub Pages` workflow manually.

The workflow passes the Supabase values into `npm run build`, so the deployed app connects to the same database as local development.
