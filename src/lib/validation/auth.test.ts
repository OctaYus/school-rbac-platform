import { describe, expect, it } from "vitest";

import { acceptInviteSchema, loginSchema, strongPasswordSchema } from "@/lib/validation/auth";

describe("loginSchema", () => {
  it("accepts and normalizes a valid login", () => {
    const parsed = loginSchema.parse({ email: "  USER@Example.COM ", password: "whatever" });
    expect(parsed.email).toBe("user@example.com");
  });

  it("rejects unexpected keys (.strict)", () => {
    const result = loginSchema.safeParse({
      email: "a@b.com",
      password: "x",
      isAdmin: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed TOTP code", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x", totp: "12ab" }).success).toBe(
      false,
    );
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x", totp: "123456" }).success).toBe(
      true,
    );
  });
});

describe("strongPasswordSchema", () => {
  it("rejects weak passwords", () => {
    for (const weak of ["short", "alllowercaseletters", "NoNumbersOrSymbols"]) {
      expect(strongPasswordSchema.safeParse(weak).success).toBe(false);
    }
  });

  it("accepts a strong password", () => {
    expect(strongPasswordSchema.safeParse("Aa1!verylongpassword").success).toBe(true);
  });
});

describe("acceptInviteSchema", () => {
  it("requires token, name, and a strong password", () => {
    expect(
      acceptInviteSchema.safeParse({
        token: "0123456789abcdef",
        name: "Jane Doe",
        password: "Aa1!verylongpassword",
      }).success,
    ).toBe(true);
    expect(
      acceptInviteSchema.safeParse({ token: "short", name: "", password: "weak" }).success,
    ).toBe(false);
  });
});
