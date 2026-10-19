import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Verify the email allowlist in the applied signup migration, not a duplicate configuration.
const migration = readFileSync("drizzle/migrations/0001_update_admin_signup_email.sql", "utf8");
const designatedEmail = migration.match(/IF lower\(NEW\.email\) = '([^']+)' THEN/)?.[1];
function receivesAdmin(email: string) {
  if (!designatedEmail) throw new Error("Missing signup administrator email condition");
  return email.toLowerCase() === designatedEmail;
}

describe("administrator signup email", () => {
  it("grants administrator eligibility to the new Gmail, regardless of letter case", () => {
    expect(receivesAdmin("conectalocaladmin@gmail.com")).toBe(true);
    expect(receivesAdmin("ConectaLocalAdmin@Gmail.com")).toBe(true);
  });
  it("does not grant administrator eligibility to the old email or other accounts", () => {
    expect(receivesAdmin("admin@conectalocal.cl")).toBe(false);
    expect(receivesAdmin("otro@gmail.com")).toBe(false);
  });
});