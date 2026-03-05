"use client";

import { useRef, useCallback, useState } from "react";

interface SwipeState {
  direction: "left" | "right" | null;
  distance: number;
  swiping: boolean;
}

interface UseSwipeGestureOptions {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useSwipeGesture({
  threshold = 50,
  onSwipeLeft,
  onSwipeRight,
}: UseSwipeGestureOptions = {}) {
  const [state, setState] = useState<SwipeState>({ direction: null, distance: 0, swiping: false });
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    tracking.current = true;
    setState({ direction: null, distance: 0, swiping: false });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!tracking.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    // Check angle — must be mostly horizontal (< 30 degrees)
    if (Math.abs(dy) > Math.abs(dx) * 0.577) {
      tracking.current = false;
      setState({ direction: null, distance: 0, swiping: false });
      return;
    }

    const direction = dx > 0 ? "right" : "left";
    setState({ direction, distance: Math.abs(dx), swiping: true });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!tracking.current) {
      setState({ direction: null, distance: 0, swiping: false });
      return;
    }
    tracking.current = false;

    setState((prev) => {
      if (prev.distance >= threshold) {
        if (prev.direction === "left") onSwipeLeft?.();
        if (prev.direction === "right") onSwipeRight?.();
      }
      return { direction: null, distance: 0, swiping: false };
    });
  }, [threshold, onSwipeLeft, onSwipeRight]);

  return {
    ...state,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
