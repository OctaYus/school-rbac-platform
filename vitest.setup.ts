// Deterministic env for unit tests. A throwaway 32-byte (hex) encryption key
// so crypto round-trip tests work without a real secret.
process.env.ENCRYPTION_KEY ??= "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
process.env.AUTH_SECRET ??= "test-secret-not-for-production";
