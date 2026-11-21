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

## Push notifications

Payday checks, your partner's savings, things running behind and deposits due. Set up once:

1. SQL Editor: paste `update-2026-11-21.sql` → Run. (Nothing to fill in. The push keys are made and kept in the database, readable only by the server.)
2. Edge Functions → Deploy a new function → Via editor → name it `push` → paste `supabase/functions/push/index.ts` → Deploy, then Settings → turn **Verify JWT** off → Save.
3. On each phone: Bagsy (from the home screen) → You → Turn on notifications → Send a test.

On iPhone, notifications only work for Bagsy opened from the home screen (iOS 16.4 or later).

## Forgot password

The sign-in screen has "Forgot your password?". Supabase sends the reset email. Its built-in email only delivers to members of your Supabase organisation and only a few an hour, so for anyone else (Ines) add your own SMTP under Authentication → Emails → SMTP settings (a Gmail app password works).
