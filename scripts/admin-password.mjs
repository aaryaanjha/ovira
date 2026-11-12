import { randomBytes, scryptSync } from "node:crypto";

const password = randomBytes(21).toString("base64url");
const salt = randomBytes(16);
console.log("Store this staff password in your password manager: " + password);
console.log("Set ADMIN_PASSWORD_HASH to: " + salt.toString("hex") + ":" + scryptSync(password, salt, 64).toString("hex"));
