import { describe, expect, it } from "vitest";

import { decrypt, encrypt, encryptNullable, isEncrypted, safeEqual } from "@/lib/security/crypto";

describe("AES-256-GCM crypto", () => {
  it("round-trips plaintext", () => {
    const plaintext = "Sensitive: student mental-health note ✓ 漢字";
    const bundle = encrypt(plaintext);
    expect(bundle.startsWith("v1:")).toBe(true);
    expect(decrypt(bundle)).toBe(plaintext);
  });

  it("produces a different IV/ciphertext each time", () => {
    const a = encrypt("same input");
    const b = encrypt("same input");
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe(decrypt(b));
  });

  it("binds ciphertext to AAD (context)", () => {
    const bundle = encrypt("payload", "healthrecord");
    expect(decrypt(bundle, "healthrecord")).toBe("payload");
    expect(() => decrypt(bundle, "wrong-context")).toThrow();
    expect(() => decrypt(bundle)).toThrow();
  });

  it("rejects tampered ciphertext (auth tag mismatch)", () => {
    const bundle = encrypt("payload");
    const [v, iv, tag, data] = bundle.split(":");
    const flipped = data[0] === "A" ? "B" : "A";
    const tampered = [v, iv, tag, flipped + data.slice(1)].join(":");
    expect(() => decrypt(tampered)).toThrow();
  });

  it("rejects malformed bundles", () => {
    expect(() => decrypt("not-a-bundle")).toThrow();
    expect(() => decrypt("v2:a:b:c")).toThrow();
  });

  it("passes through nullish values", () => {
    expect(encryptNullable(null)).toBeNull();
    expect(encryptNullable("")).toBeNull();
    expect(isEncrypted(encrypt("x"))).toBe(true);
    expect(isEncrypted("plain")).toBe(false);
  });

  it("safeEqual compares in constant time correctly", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});
