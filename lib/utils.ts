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

// Allow letters, numbers, hyphens, underscores, periods (no spaces)
const USERNAME_REGEX = /^[a-zA-Z0-9_\-\.]+$/;

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
    return { valid: false, error: "Name can only contain letters, numbers, hyphens, underscores, and periods (no spaces)." };
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

// Stable username → color mapping for chat
const USER_COLORS = [
  "text-red-400",
  "text-orange-400",
  "text-amber-400",
  "text-yellow-400",
  "text-lime-400",
  "text-green-400",
  "text-emerald-400",
  "text-teal-400",
  "text-cyan-400",
  "text-sky-400",
  "text-blue-400",
  "text-indigo-400",
  "text-violet-400",
  "text-purple-400",
  "text-fuchsia-400",
  "text-pink-400",
  "text-rose-400",
];

// Avatar bg/text color pairs matching USER_COLORS
const AVATAR_COLORS = [
  "bg-red-900/60 text-red-300",
  "bg-orange-900/60 text-orange-300",
  "bg-amber-900/60 text-amber-300",
  "bg-yellow-900/60 text-yellow-300",
  "bg-lime-900/60 text-lime-300",
  "bg-green-900/60 text-green-300",
  "bg-emerald-900/60 text-emerald-300",
  "bg-teal-900/60 text-teal-300",
  "bg-cyan-900/60 text-cyan-300",
  "bg-sky-900/60 text-sky-300",
  "bg-blue-900/60 text-blue-300",
  "bg-indigo-900/60 text-indigo-300",
  "bg-violet-900/60 text-violet-300",
  "bg-purple-900/60 text-purple-300",
  "bg-fuchsia-900/60 text-fuchsia-300",
  "bg-pink-900/60 text-pink-300",
  "bg-rose-900/60 text-rose-300",
];

function getUserHash(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getUserColor(username: string): string {
  return USER_COLORS[getUserHash(username) % USER_COLORS.length];
}

export function getUserAvatarColor(username: string): string {
  return AVATAR_COLORS[getUserHash(username) % AVATAR_COLORS.length];
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
