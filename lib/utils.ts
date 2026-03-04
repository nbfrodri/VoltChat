const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateRoomId(): string {
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => CHARS[b % CHARS.length]).join("");
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
