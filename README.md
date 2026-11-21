# Bagsy

Save for a trip together. Each of you bagsies your part. Bagsy never moves money: you log what goes into your own accounts.

An installable web app (PWA). Hosted on GitHub Pages, data in Supabase.

## Setup (once)

1. **Supabase project**: supabase.com → New project (free). Pick a strong database password and a region near you (London).
2. **Database**: in the project, SQL Editor → New query → paste all of `schema.sql` → Run.
3. **Sign-in**: Authentication → Sign In / Providers → Email → turn **Confirm email** off → Save. People sign in with email and password, so Bagsy sends no emails.
4. **Website address**: Authentication → URL Configuration → Site URL: `https://<your-github-name>.github.io/bagsy/`
5. **Keys**: Project Settings → API. Copy the Project URL and the `anon` `public` key into `config.js`. (The anon key is meant to be public. The security rules in `schema.sql` stop anyone reading trips they're not in.)
6. **Hosting**: GitHub repo → Settings → Pages → Source: Deploy from a branch → `main` / root → Save. The app appears at `https://<your-github-name>.github.io/bagsy/` a minute later.

## Install on a phone

- iPhone: open the link in Safari → Share → Add to Home Screen. Open it from the home screen and sign in there (the home-screen app keeps its own sign-in).
- Android: open in Chrome → menu → Install app.

## Editing the code

Source lives in the `_*.js`, `_*.css` and `*.tpl.*` files. Run `python3 build.py` to rebuild `index.html`, `app.js` and `sw.js`. Leave `config.js` empty to run in preview mode (fake data in your browser, code is always 123456).

## Keeping the free database awake

Supabase pauses free projects after a week with no activity. `.github/workflows/keepalive.yml` pings it every 3 days from GitHub, for free. To check it: repo → Actions → Keep Supabase awake → Run workflow.

## Limits for now

- No "forgot password" yet. If someone forgets theirs, an admin can send a reset from Authentication → Users; a proper reset screen is a next step.
- No push notifications yet. Payment-day checks show in the Activity tab and as a badge on the app icon.
