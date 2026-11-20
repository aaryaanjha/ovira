# OVIRA

OVIRA is a Next.js fertility-care website with a protected admin panel at `/admin`. Public blogs, Myths & Facts, testimonials, homepage slides, contact information, and social links share the admin panel's content store.

## Run locally

Requires Node.js 24.x.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

The local development command uses Webpack to avoid Turbopack persistence-cache failures in synced Windows folders such as OneDrive. Production builds remain unchanged.

Open http://localhost:3000 for the website or http://localhost:3000/admin for the admin panel.

Set `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `ADMIN_SESSION_SECRET` in `.env.local` before using the admin panel. `npm run admin:password` generates a password and its scrypt hash; save the password in a password manager and put only the hash in the environment file. Generate a session secret with `npm run admin:secret`. Keep `.env.local` private; it is excluded from Git.

## Data and deployment

Local development uses SQLite at `.data/ovira.sqlite` and stores uploads under `.data/media/`. Keep these files on persistent storage and include them in protected backups; the database contains appointment and contact information. `OVIRA_DB_PATH` can change the database file location.

For Vercel, the site uses Supabase: Postgres for content, leads and appointments, and Supabase Storage for admin image uploads. See **Deploy on Vercel with Supabase** below. The local SQLite database and uploaded files are not copied automatically to Supabase; transfer them deliberately if needed, and do not commit `.data/`.

### Google Sheets for appointments

Google Sheets can store appointment requests and provide the Admin dashboard's Leads and Appointments views when a database is unavailable. Create a Google service account, enable the Google Sheets API, and share the spreadsheet with the service account's email as an editor. Set `GOOGLE_SHEET_ID`, `GOOGLE_CLIENT_EMAIL`, and `GOOGLE_PRIVATE_KEY` in the hosting provider's environment settings; keep the private key secret and never add it to Git or send it in chat. With no database, Sheets is selected automatically. If a database is also configured, set `OVIRA_APPOINTMENT_STORAGE=google-sheets` to select Sheets for leads and appointments.

Put the Google variables in your private `.env.local` file, then run `npm run sheets:setup` from a trusted local environment to create or safely extend the workbook's `Leads`, `Posts`, and `Settings` tabs. Existing lead rows are preserved while the appointment columns are added. In Sheets-only mode, admin sign-in still requires `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, and `APP_ORIGIN`; only Analytics, Leads, Appointments, and Admin profile are available, while other website content management requires a database. Set the environment variables in Vercel and redeploy after setup. Appointment and contact data is sensitive: limit spreadsheet access to authorized staff and do not collect medical information in the form or staff notes.

On other production hosts, SQLite and uploads can remain under `.data/` if the host provides persistent storage. Use HTTPS and set `APP_ORIGIN` to the exact public origin. The admin uses a signed, HttpOnly session cookie that expires after eight hours. Rotating the password hash or session secret invalidates existing sessions. Use a single application instance for SQLite and configure host-level rate limits; set `TRUSTED_CLIENT_IP_HEADER` only when a trusted proxy overwrites that header.

Before deployment, run `npm run build` and `npm start`. Verify that a test appointment appears in Leads and Appointments, update its status, publish a test blog, and confirm published content and contact changes appear on the public site. Do not enter medical information in the appointment form or staff notes.

## Deploy on Vercel with Supabase

1. **Create the database and image storage.** In Supabase, open your project → **SQL Editor** → **New query**, paste all of [`supabase/setup.sql`](supabase/setup.sql) and click **Run**. It creates the tables, applies the image-metadata compatibility migration, turns on row-level security, adds starter articles, myths, slides and contact details, and creates the public `ovira-media` image bucket. PostgreSQL stores editable content, leads, appointments, and image metadata; Supabase Storage stores uploaded image files. Running the SQL again is safe.
2. **Create the admin login.** Run `npm run admin:password -- "your strong password"` (12+ characters). It prints `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET`.
3. **Add environment variables** in Vercel → Project → **Settings** → **Environment Variables** (Production and Preview):

   | Name | Where to find it |
   | --- | --- |
   | `DATABASE_URL` | Supabase → **Connect** → **Transaction pooler** connection string (port 6543), with your database password filled in |
   | `SUPABASE_URL` | Supabase → Project Settings → **API** → Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → **API** → `service_role` secret key (never share it or expose it in the browser) |
   | `SUPABASE_STORAGE_BUCKET` | Optional; use `ovira-media` to match the bucket created by the SQL |
   | `ADMIN_USERNAME` | Any login name you choose, for example `admin` |
   | `ADMIN_PASSWORD_HASH` | From step 2 |
   | `ADMIN_SESSION_SECRET` | From step 2 |
   | `APP_ORIGIN` | Your live site address, for example `https://www.ovirascience.com` (no trailing slash) |

4. **Redeploy** from Vercel → Deployments → ⋯ → **Redeploy**.
5. **Check it:** send a test request from `/appointment`, sign in at `/admin` and confirm it appears under Leads and Appointments. Upload an image under Media, verify it displays on the site, then edit and publish a test post to confirm database and Storage work together.

After signing in, the **Dashboard** shows a setup check for the database, image storage and site address. Each problem comes with the exact fix (wrong password, wrong connection string type, missing bucket, wrong key). If something on the live site looks wrong, check there first.

If `DATABASE_URL` is missing or the database cannot be reached, public pages still load from built-in content and the problem is logged in Vercel's function logs. Saving form requests and admin changes needs a working database.

`SUPABASE_SERVICE_ROLE_KEY` accepts either the legacy `service_role` key (`eyJ…`) or the newer secret key (`sb_secret_…`).

If the schema or starter content changes in code, regenerate the SQL with `npm run supabase:sql`.

## Search and sharing

Set `APP_ORIGIN` to the canonical production origin. The site generates canonical URLs, page metadata, social-sharing cards, organization and article structured data, `robots.txt`, and an XML sitemap at `/sitemap.xml`. Submit the sitemap to Google Search Console and Bing Webmaster Tools after deployment, and verify that the live pages and images are crawlable.

Keep published health content accurate, cite reputable medical sources, and have clinical claims reviewed by a qualified professional. Search rankings and AI-generated answers cannot be guaranteed. Backlinks are earned through useful content, relevant professional relationships, and legitimate editorial mentions; do not buy links or use automated link schemes.
