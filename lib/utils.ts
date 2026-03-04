const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateRoomId(): string {
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => CHARS[b % CHARS.length]).join("");
}

// --- Input validation ---

const ROOM_ID_REGEX = /^[a-zA-Z0-9]{1,20}$/;

/** Validate a room ID: 1-20 alphanumeric chars only */
export function isValidRoomId(id: string): boolean {
  return ROOM_ID_REGEX.test(id);
}

// Allow letters, numbers, spaces, hyphens, underscores, periods
const USERNAME_REGEX = /^[a-zA-Z0-9 _\-\.]+$/;

/** Strip control characters and zero-width chars from a string */
function stripControlChars(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x1F\x7F\u200B-\u200F\u2028-\u202F\uFEFF]/g, "");
}

/**
 * Sanitize and validate a username.
 * Returns { valid: true, name } or { valid: false, error }.
 */
export function validateUsername(raw: string): { valid: true; name: string } | { valid: false; error: string } {
  const cleaned = stripControlChars(raw).trim();
  if (!cleaned) {
    return { valid: false, error: "Please enter a name to enter the void." };
  }
  if (cleaned.length > 24) {
    return { valid: false, error: "Name must be 24 characters or less." };
  }
  if (cleaned.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters." };
  }
  if (cleaned.toLowerCase() === "system") {
    return { valid: false, error: "That name is reserved." };
  }
  if (!USERNAME_REGEX.test(cleaned)) {
    return { valid: false, error: "Name can only contain letters, numbers, spaces, hyphens, underscores, and periods." };
  }
  return { valid: true, name: cleaned };
}

/** Clamp and validate maxUsers URL param. Returns undefined if invalid. */
export function parseMaxUsers(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 2 || n > 50) return undefined;
  return n;
}

/** Validate visibility URL param */
export function parseVisibility(raw: string | null): "public" | "private" {
  return raw === "public" ? "public" : "private";
}

export function getMessageOpacity(index: number, total: number): number {
  if (total <= 5) return 1;

  const reverseIndex = total - 1 - index; // 0 = newest
  const fullyVisibleCount = 5;
  const fadeRange = 10;

  if (reverseIndex < fullyVisibleCount) return 1;
  if (reverseIndex < fullyVisibleCount + fadeRange) {
    const fadeProgress = (reverseIndex - fullyVisibleCount) / fadeRange;
    return Math.max(0.15, 1 - fadeProgress * 0.85);
  }
  return 0.15;
}
