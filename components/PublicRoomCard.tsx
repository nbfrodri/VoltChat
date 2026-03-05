"use client";

import { useEffect, useState } from "react";
import { Hash, Users, Share2, ShieldCheck, Timer } from "lucide-react";
import type { PublicRoom } from "@/lib/types";
import TagBadge from "@/components/TagBadge";

interface PublicRoomCardProps {
  room: PublicRoom;
  onClick: () => void;
  onShare?: () => void;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "expired";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function PublicRoomCard({ room, onClick, onShare }: PublicRoomCardProps) {
  const tags = room.tags || [];
  const visibleTags = tags.slice(0, 3);
  const extraCount = tags.length - 3;
  const [remaining, setRemaining] = useState<number | null>(null);

  // Live TTL countdown
  useEffect(() => {
    if (!room.ttl || !room.roomCreatedAt) return;
    const ttlMs = room.ttl * 60 * 1000;
    function update() {
      const elapsed = Date.now() - room.roomCreatedAt!;
      setRemaining(Math.max(0, ttlMs - elapsed));
    }
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [room.ttl, room.roomCreatedAt]);

  const isExpiring = remaining !== null && remaining < 5 * 60 * 1000;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-emerald-700/30 rounded-xl p-4 transition-all hover:shadow-glow-green group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-emerald-400" />
          <span className="text-base font-medium text-gray-100 group-hover:text-emerald-300 transition-colors">
            {room.roomId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onShare && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onShare(); } }}
              className="p-1 text-gray-600 hover:text-gray-300 transition-colors"
              aria-label="Share room"
            >
              <Share2 className="h-4 w-4" />
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>
              {room.userCount}
              {room.maxUsers ? `/${room.maxUsers}` : ""}
            </span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        {room.encrypted && (
          <span title="End-to-end encrypted">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          </span>
        )}
        {remaining !== null && (
          <span
            title={`Time remaining: ${formatRemaining(remaining)}`}
            className={`flex items-center gap-0.5 text-xs tabular-nums ${
              isExpiring ? "text-red-400" : "text-gray-600"
            }`}
          >
            <Timer className={`h-3 w-3 ${isExpiring ? "text-red-400" : ""}`} />
            {formatRemaining(remaining)}
          </span>
        )}
        {room.ttl && remaining === null && (
          <span className="flex items-center gap-0.5 text-xs text-gray-600">
            <Timer className="h-3 w-3" />
            {room.ttl >= 60 ? `${room.ttl / 60}h` : `${room.ttl}m`}
          </span>
        )}
      </div>
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {visibleTags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} size="sm" />
          ))}
          {extraCount > 0 && (
            <span className="text-[10px] text-gray-500 self-center">+{extraCount}</span>
          )}
        </div>
      )}
    </button>
  );
}
