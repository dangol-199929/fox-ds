import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Authenticated encryption (AES-256-GCM) for small JSON values stored in
 * cookies, so tokens are unreadable and tamper-evident in the browser.
 * The key is derived from SESSION_SECRET.
 */

function key(secret: string): Buffer {
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  return createHash("sha256").update(secret).digest();
}

export function seal(value: unknown, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64url")).join(".");
}

/** Returns null for anything tampered, truncated or sealed with another key. */
export function unseal<T>(sealed: string | undefined, secret: string): T | null {
  if (!sealed) return null;
  const parts = sealed.split(".");
  if (parts.length !== 3) return null;
  try {
    const [iv, tag, body] = parts.map((p) => Buffer.from(p, "base64url"));
    if (iv!.length !== 12 || tag!.length !== 16) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(secret), iv!);
    decipher.setAuthTag(tag!);
    const text = Buffer.concat([decipher.update(body!), decipher.final()]).toString("utf8");
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
