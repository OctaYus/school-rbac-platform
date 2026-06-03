import { describe, expect, it } from "vitest";
import { authenticator } from "otplib";

import {
  backupCodeMatches,
  generateBackupCodes,
  generateMfaSecret,
  hashBackupCode,
  verifyTotp,
} from "@/lib/auth/totp";

describe("TOTP", () => {
  it("verifies a freshly generated code", () => {
    const secret = generateMfaSecret();
    const token = authenticator.generate(secret);
    expect(verifyTotp(token, secret)).toBe(true);
  });

  it("rejects malformed and wrong codes", () => {
    const secret = generateMfaSecret();
    expect(verifyTotp("12ab", secret)).toBe(false);
    expect(verifyTotp("1234567", secret)).toBe(false);
    const otherSecret = generateMfaSecret();
    const wrong = authenticator.generate(otherSecret);
    // Astronomically unlikely to collide.
    expect(verifyTotp(wrong, secret)).toBe(false);
  });
});

describe("backup codes", () => {
  it("generates 10 unique codes with matching hashes", () => {
    const { codes, hashes } = generateBackupCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    codes.forEach((code, i) => {
      expect(hashes[i]).toBe(hashBackupCode(code));
      expect(backupCodeMatches(code, hashes[i])).toBe(true);
    });
  });

  it("matches case-insensitively and ignores dashes/spaces", () => {
    const { codes, hashes } = generateBackupCodes();
    const formatted = codes[0].toLowerCase().replace("-", " ");
    expect(backupCodeMatches(formatted, hashes[0])).toBe(true);
  });

  it("rejects a non-matching code", () => {
    const { hashes } = generateBackupCodes();
    expect(backupCodeMatches("0000-0000", hashes[0])).toBe(false);
  });
});
