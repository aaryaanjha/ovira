# OVIRA

OVIRA is a Next.js fertility-care website with a protected admin panel at `/admin`. Public blogs, Myths & Facts, testimonials, homepage slides, contact information, and social links share the admin panel's content store.

## Run locally

Requires Node.js 22.13 or newer.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000 for the website or http://localhost:3000/admin for the admin panel.

Set `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `ADMIN_SESSION_SECRET` in `.env.local` before using the admin panel. `npm run admin:password` generates a password and its scrypt hash; save the password in a password manager and put only the hash in the environment file. Generate a session secret with `npm run admin:secret`. Keep `.env.local` private; it is excluded from Git.

## Data and deployment

Local development uses SQLite at `.data/ovira.sqlite` and stores uploads under `.data/media/`. Keep these files on persistent storage and include them in protected backups; the database contains appointment and contact information. `OVIRA_DB_PATH` can change the database file location.

For Vercel, connect a Neon Postgres database and Vercel Blob storage to the project. Set `DATABASE_URL` (or `POSTGRES_URL`) to the pooled Neon connection string; the app creates its schema and seeds the starter content on first use. Vercel Blob supplies `BLOB_READ_WRITE_TOKEN` for admin image uploads. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, and `APP_ORIGIN` in the Vercel Production environment, then redeploy. The local SQLite database and uploaded files are not copied automatically to Neon or Blob; transfer them deliberately if needed, and do not commit `.data/`.

On other production hosts, SQLite and uploads can remain under `.data/` if the host provides persistent storage. Use HTTPS and set `APP_ORIGIN` to the exact public origin. The admin uses a signed, HttpOnly session cookie that expires after eight hours. Rotating the password hash or session secret invalidates existing sessions. Use a single application instance for SQLite and configure host-level rate limits; set `TRUSTED_CLIENT_IP_HEADER` only when a trusted proxy overwrites that header.

Before deployment, run `npm run build` and `npm start`. Verify that a test appointment appears in Leads and Appointments, update its status, publish a test blog, and confirm published content and contact changes appear on the public site. Do not enter medical information in the appointment form or staff notes.

## Search and sharing

Set `APP_ORIGIN` to the canonical production origin. The site generates canonical URLs, page metadata, social-sharing cards, organization and article structured data, `robots.txt`, and an XML sitemap at `/sitemap.xml`. Submit the sitemap to Google Search Console and Bing Webmaster Tools after deployment, and verify that the live pages and images are crawlable.

Keep published health content accurate, cite reputable medical sources, and have clinical claims reviewed by a qualified professional. Search rankings and AI-generated answers cannot be guaranteed. Backlinks are earned through useful content, relevant professional relationships, and legitimate editorial mentions; do not buy links or use automated link schemes.
