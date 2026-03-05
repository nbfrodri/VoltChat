/**
 * Haptic feedback utilities for mobile devices.
 * Uses navigator.vibrate() on Android Chrome with graceful no-op on unsupported devices.
 */

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function hapticTap(): void {
  vibrate(10);
}

export function hapticSuccess(): void {
  vibrate(50);
}

export function hapticWarning(): void {
  vibrate([100, 50, 100]);
}
