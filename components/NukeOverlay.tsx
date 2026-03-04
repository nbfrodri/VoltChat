"use client";

import { useEffect, useRef, useState } from "react";

interface NukeOverlayProps {
  onComplete: () => void;
}

export default function NukeOverlay({ onComplete }: NukeOverlayProps) {
  const [phase, setPhase] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 0);
    const t2 = setTimeout(() => setPhase(2), 600);
    const t3 = setTimeout(() => setPhase(3), 1400);
    const t4 = setTimeout(() => onComplete(), 2800);

    timeoutsRef.current = [t1, t2, t3, t4];

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [onComplete]);

  if (phase < 3) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="text-center animate-slide-in" role="alert" aria-live="assertive">
        <p className="text-red-500 text-xl uppercase tracking-widest font-bold">
          Room Nuked
        </p>
        <p className="text-gray-600 text-xs mt-2">
          — all traces erased —
        </p>
        <p className="text-gray-700 text-xs mt-4">
          Returning to the void...
        </p>
      </div>
    </div>
  );
}
