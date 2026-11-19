// Creates the admin login values for Vercel.
//   npm run admin:password                  -> generates a strong random password
//   npm run admin:password -- "my password" -> uses the password you choose (12+ characters)
import { randomBytes, scryptSync } from "node:crypto";

const chosen = process.argv[2];
if (chosen !== undefined && chosen.length < 12) {
  console.error("Choose a password with at least 12 characters.");
  process.exit(1);
}
const password = chosen ?? randomBytes(21).toString("base64url");
const salt = randomBytes(16);

if (chosen === undefined) console.log("Admin password (save it in your password manager): " + password + "\n");
console.log("Add these in Vercel -> Project -> Settings -> Environment Variables:\n");
console.log("ADMIN_PASSWORD_HASH=" + salt.toString("hex") + ":" + scryptSync(password, salt, 64).toString("hex"));
console.log("ADMIN_SESSION_SECRET=" + randomBytes(32).toString("hex"));
