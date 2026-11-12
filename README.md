# OVIRA Fertility Care

Next.js App Router and React. The public pages preserve the original OVIRA design and article links. The original HTML delivery remains in `files-mentioned-by-the-user-book/outputs` for reference. Run the Next.js app for booking and staff workflows.

## Run locally

Requires Node.js 20.9+.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. The public site can preview the original articles and contact details before Google Sheets is connected. Booking requires the workbook connection. The staff dashboard is at http://localhost:3000/admin.

## Connect Google Sheets

1. Create a private Google spreadsheet. Copy the ID between `/d/` and `/edit` in its URL into `GOOGLE_SHEET_ID`.
2. Enable the Google Sheets API in your Google Cloud project. Create a service account and its credentials. Share the workbook with the service account email as **Editor**.
3. Set `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` in `.env.local` from the service account key. Wrap the private key in double quotes and keep the literal `\n` line breaks from the key JSON. Store deployment values as server-side secrets.
4. Run `npm run sheets:setup`. It creates the **Leads**, **Posts**, and **Settings** tabs and seeds the six original journal articles and the current contact details. It checks existing headers and skips populated tabs on a repeat run.
5. Set the staff sign-in address in `ADMIN_EMAIL`. Run `npm run admin:password` to generate a staff password and its hash. Save the password in your password manager and put the hash in `ADMIN_PASSWORD_HASH`. Set `ADMIN_SESSION_SECRET` using `npm run admin:secret`. Restart the app after editing the environment.

Use the dashboard to update statuses and notes, write or archive posts, and change the public contact details. Keep the workbook private. If you work directly in Sheets, use filter views and avoid moving or deleting data rows while the dashboard is saving changes.

## Deploy

Run `npm run build` and deploy to a Node-capable Next.js host. Use HTTPS and set `APP_ORIGIN` to the exact public origin, for example `https://your-domain.example`. The dashboard uses one staff password and an eight-hour signed cookie. Rotating the password hash or session secret invalidates prior sessions. For multi-instance hosting, apply login and appointment rate limits at the host or proxy. Configure `TRUSTED_CLIENT_IP_HEADER` only if the proxy overwrites that header.

Verify the deployed setup with a dummy request. Check that it appears as New in the dashboard, update it to Contacted, publish a test post, and confirm the public site reflects the post and a contact update. Avoid including medical information in the appointment form or in staff notes.
