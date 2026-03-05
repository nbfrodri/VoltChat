"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseResizableOptions {
  min?: number;
  max?: number;
  defaultWidth?: number;
  storageKey?: string;
}

export function useResizable({
  min = 200,
  max = 400,
  defaultWidth = 256,
  storageKey = "voltchat-sidebar-width",
}: UseResizableOptions = {}) {
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return defaultWidth;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const n = parseInt(stored, 10);
      if (n >= min && n <= max) return n;
    }
    return defaultWidth;
  });

  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [width]
  );

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(max, Math.max(min, startWidth.current + delta));
      setWidth(newWidth);
    }

    function handleMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      // Persist
      localStorage.setItem(storageKey, String(startWidth.current + 0));
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [min, max, storageKey]);

  // Save on width change
  useEffect(() => {
    localStorage.setItem(storageKey, String(width));
  }, [width, storageKey]);

  return { width, handleMouseDown };
}
