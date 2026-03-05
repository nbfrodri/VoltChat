/**
 * E2E Encryption using Web Crypto API (AES-GCM 256-bit).
 * Key is shared via URL fragment (#key=...) — never sent to the server.
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV for AES-GCM

/** Check if Web Crypto is available */
export function isCryptoSupported(): boolean {
  return typeof window !== "undefined" && !!window.crypto?.subtle;
}

/** Generate a new AES-GCM 256-bit key and export as base64url string */
export async function generateRoomKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );
  const raw = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64Url(raw);
}

/** Import a base64url-encoded key string into a CryptoKey */
export async function importRoomKey(base64Key: string): Promise<CryptoKey> {
  const raw = base64UrlToArrayBuffer(base64Key);
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypt plaintext → base64url string (IV prepended to ciphertext) */
export async function encryptMessage(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );
  // Prepend IV to ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return arrayBufferToBase64Url(combined.buffer);
}

/** Decrypt base64url string (IV + ciphertext) → plaintext */
export async function decryptMessage(encrypted: string, key: CryptoKey): Promise<string> {
  const combined = new Uint8Array(base64UrlToArrayBuffer(encrypted));
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

/** Extract encryption key from URL hash fragment (e.g., #key=abc123) */
export function getKeyFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash) return null;
  const match = hash.match(/[#&]key=([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

// --- Base64url helpers ---

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
