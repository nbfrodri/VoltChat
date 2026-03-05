"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Plus, Hash, ArrowRight, Globe, Loader2, Github, Bookmark, Trash2, X } from "lucide-react";
import { generateRoomId, isValidRoomId } from "@/lib/utils";
import { generateRoomKey } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";
import { useLobby } from "@/hooks/useLobby";
import { useBookmarks } from "@/hooks/useBookmarks";
import type { RoomVisibility, UserPresence, RoomTag } from "@/lib/types";
import PublicRoomCard from "@/components/PublicRoomCard";
import CreateRoomModal from "@/components/CreateRoomModal";
import ShareModal from "@/components/ShareModal";
import SafetyDisclaimer from "@/components/SafetyDisclaimer";

export default function LandingPage() {
  const router = useRouter();
  const [joinId, setJoinId] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shareRoomId, setShareRoomId] = useState<string | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const { publicRooms, isLoading } = useLobby();
  const { bookmarks, addBookmark, removeBookmark, isBookmarked, clearBookmarks } = useBookmarks();
  const checkChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Extract all unique tags from public rooms for filtering
  const allTags = useMemo(() => {
    const tagMap = new Map<string, { label: string; color: string; count: number }>();
    for (const room of publicRooms) {
      for (const tag of room.tags || []) {
        const key = tag.label.toLowerCase();
        const existing = tagMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          tagMap.set(key, { label: tag.label, color: tag.color, count: 1 });
        }
      }
    }
    return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
  }, [publicRooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    if (!activeTagFilter) return publicRooms;
    return publicRooms.filter((room) =>
      (room.tags || []).some((t) => t.label.toLowerCase() === activeTagFilter.toLowerCase())
    );
  }, [publicRooms, activeTagFilter]);

  async function handleCreateRoom(visibility: RoomVisibility, maxUsers?: number, tags?: RoomTag[], encrypted?: boolean, ttl?: number) {
    const roomId = generateRoomId();
    const params = new URLSearchParams({ v: visibility });
    if (maxUsers) params.set("max", String(maxUsers));
    if (tags?.length) params.set("tags", JSON.stringify(tags));
    if (ttl) params.set("ttl", String(ttl));

    let hashFragment = "";
    if (encrypted) {
      try {
        const key = await generateRoomKey();
        params.set("e2ee", "1");
        hashFragment = `#key=${key}`;
      } catch {
        // Crypto not supported — continue without encryption
      }
    }

    router.push(`/room/${roomId}?${params.toString()}${hashFragment}`);
  }

  async function handleJoinRoom(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = joinId.trim();
    if (!trimmed || isChecking) return;
    if (!isValidRoomId(trimmed)) {
      setJoinError("Room ID can only contain letters and numbers (max 20 chars).");
      return;
    }
    setJoinError(null);
    setIsChecking(true);

    if (checkChannelRef.current) {
      supabase.removeChannel(checkChannelRef.current);
      checkChannelRef.current = null;
    }

    try {
      const exists = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => { cleanup(); resolve(false); }, 4000);

        const channel = supabase.channel(`room_${trimmed}`, {
          config: { presence: { key: `_check_${Date.now()}` } },
        });
        checkChannelRef.current = channel;

        function cleanup() {
          clearTimeout(timeout);
          supabase.removeChannel(channel);
          checkChannelRef.current = null;
        }

        channel.on("presence", { event: "sync" }, () => {
          const state = channel.presenceState<UserPresence>();
          const users = Object.values(state).flat();
          cleanup();
          resolve(users.length > 0);
        });

        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setTimeout(() => {
              const state = channel.presenceState<UserPresence>();
              const users = Object.values(state).flat();
              cleanup();
              resolve(users.length > 0);
            }, 800);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            cleanup();
            resolve(false);
          }
        });
      });

      if (exists) {
        router.push(`/room/${trimmed}`);
      } else {
        setJoinError("No active room found with that ID.");
        setIsChecking(false);
      }
    } catch {
      setJoinError("Could not check room. Try again.");
      setIsChecking(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-950">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <MessageCircle className="h-10 w-10 text-emerald-400" />
              <h1 className="text-4xl font-bold tracking-tight text-gray-100">VOLTCHAT</h1>
            </div>
            <p className="text-base text-gray-500">Anonymous. Ephemeral. Gone when you leave.</p>
          </div>

          {/* Create / Join card — always centered */}
          <div className="max-w-md mx-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              {/* Create Room */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-3">Start a new room</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-3.5 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <Plus className="h-5 w-5" />
                  Create Room
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">or</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              {/* Join Room */}
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-3">Join an existing room</p>
                <form onSubmit={handleJoinRoom} className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                    <input
                      type="text"
                      value={joinId}
                      onChange={(e) => { setJoinId(e.target.value); if (joinError) setJoinError(null); }}
                      placeholder="Enter room ID..."
                      maxLength={20}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-3 py-3.5 text-base text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isChecking}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl px-4 py-3.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                  >
                    {isChecking ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                  </button>
                </form>
                {joinError && <p className="text-red-400 text-sm mt-2">{joinError}</p>}
              </div>
            </div>
          </div>

          {/* Bookmarks */}
          {bookmarks.length > 0 && (
            <div className="max-w-md mx-auto mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-amber-400" />
                  <h2 className="text-sm text-gray-500 uppercase tracking-wider">Saved Rooms</h2>
                </div>
                <button onClick={clearBookmarks} className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors">
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              </div>
              <div className="space-y-1.5">
                {bookmarks.map((b) => {
                  const isActive = publicRooms.some((r) => r.roomId === b.roomId);
                  return (
                    <div key={b.roomId} className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/room/${b.roomId}`)}
                        className={`flex-1 text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                          isActive
                            ? "bg-emerald-900/10 border-emerald-800/30 text-emerald-300 hover:bg-emerald-900/20"
                            : "bg-gray-800/30 border-gray-700/50 text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        <span className="font-medium"># {b.roomId}</span>
                        {isActive && <span className="ml-2 text-xs text-emerald-400/60">active</span>}
                      </button>
                      <button
                        onClick={() => removeBookmark(b.roomId)}
                        className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors"
                        aria-label="Remove bookmark"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Public Rooms */}
          <div className="max-w-md mx-auto mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-gray-500" />
              <h2 className="text-sm text-gray-500 uppercase tracking-wider">Public Rooms</h2>
              {publicRooms.length > 0 && (
                <span className="bg-emerald-600/20 text-emerald-400 text-sm rounded-full px-2.5 py-0.5">
                  {publicRooms.length}
                </span>
              )}
            </div>

            {/* Tag filter bar */}
            {allTags.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-3 pb-1">
                <button
                  onClick={() => setActiveTagFilter(null)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                    !activeTagFilter
                      ? "bg-emerald-600/20 border-emerald-600/50 text-emerald-400"
                      : "bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  All
                </button>
                {allTags.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setActiveTagFilter(activeTagFilter === t.label ? null : t.label)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                      activeTagFilter === t.label
                        ? "border-opacity-50 scale-105"
                        : "bg-gray-800/50 border-gray-700 hover:scale-105"
                    }`}
                    style={
                      activeTagFilter === t.label
                        ? { backgroundColor: `${t.color}20`, borderColor: `${t.color}66`, color: t.color }
                        : { color: t.color }
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {isLoading ? (
              <p className="text-center text-xs text-gray-600 py-4">Scanning the void...</p>
            ) : filteredRooms.length === 0 ? (
              <p className="text-center text-xs text-gray-600 py-4">
                {activeTagFilter ? "No rooms with that tag." : "No active rooms — create one!"}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredRooms.map((room) => (
                  <PublicRoomCard
                    key={room.roomId}
                    room={room}
                    onClick={() => router.push(`/room/${room.roomId}?v=public`)}
                    onShare={() => setShareRoomId(room.roomId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-4 text-center border-t border-gray-800/50">
        <p className="text-xs text-gray-700 mb-2">
          Rooms expire when all users leave. No logs. No accounts.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://github.com/nbfrodri"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            nbfrodri
          </a>
          <span className="text-gray-800">|</span>
          <a
            href="/terms"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Terms & Conditions
          </a>
        </div>
      </footer>

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(vis, max, tags, encrypted, ttl) => {
            setShowCreateModal(false);
            handleCreateRoom(vis, max, tags, encrypted, ttl);
          }}
        />
      )}

      {/* Share Modal (for public room cards) */}
      {shareRoomId && (
        <ShareModal
          roomId={shareRoomId}
          isOpen={!!shareRoomId}
          onClose={() => setShareRoomId(null)}
        />
      )}

      {/* Safety disclaimer (first visit only) */}
      <SafetyDisclaimer />
    </div>
  );
}
