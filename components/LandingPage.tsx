"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Plus, Hash, ArrowRight, Globe } from "lucide-react";
import { generateRoomId } from "@/lib/utils";
import { useLobby } from "@/hooks/useLobby";
import type { RoomVisibility } from "@/lib/types";
import PublicRoomCard from "@/components/PublicRoomCard";
import CreateRoomModal from "@/components/CreateRoomModal";

export default function LandingPage() {
  const router = useRouter();
  const [joinId, setJoinId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { publicRooms, isLoading } = useLobby();

  function handleCreateRoom(visibility: RoomVisibility, maxUsers?: number) {
    const roomId = generateRoomId();
    const params = new URLSearchParams({ v: visibility });
    if (maxUsers) params.set("max", String(maxUsers));
    router.push(`/room/${roomId}?${params.toString()}`);
  }

  function handleJoinRoom(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = joinId.trim();
    if (!trimmed) return;
    router.push(`/room/${trimmed}`);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-950 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <MessageCircle className="h-8 w-8 text-emerald-400" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-100">
              VOLTCHAT
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Anonymous. Ephemeral. Gone when you leave.
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {/* Create Room */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Start a new room
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <Plus className="h-4 w-4" />
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
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Join an existing room
            </p>
            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                <input
                  type="text"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  placeholder="Enter room ID..."
                  maxLength={20}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Public Rooms */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-gray-500" />
            <h2 className="text-xs text-gray-500 uppercase tracking-wider">
              Public Rooms
            </h2>
            {publicRooms.length > 0 && (
              <span className="bg-emerald-600/20 text-emerald-400 text-xs rounded-full px-2 py-0.5">
                {publicRooms.length}
              </span>
            )}
          </div>

          {isLoading ? (
            <p className="text-center text-xs text-gray-600 py-4">
              Scanning the void...
            </p>
          ) : publicRooms.length === 0 ? (
            <p className="text-center text-xs text-gray-600 py-4">
              No active rooms — create one!
            </p>
          ) : (
            <div className="space-y-2">
              {publicRooms.map((room) => (
                <PublicRoomCard
                  key={room.roomId}
                  room={room}
                  onClick={() => router.push(`/room/${room.roomId}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-700 mt-6">
          Rooms expire when all users leave. No logs. No accounts.
        </p>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(vis, max) => {
            setShowCreateModal(false);
            handleCreateRoom(vis, max);
          }}
        />
      )}
    </div>
  );
}
