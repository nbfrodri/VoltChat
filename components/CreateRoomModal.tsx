"use client";

import { useState } from "react";
import { Globe, Lock, Plus, X } from "lucide-react";
import type { RoomVisibility } from "@/lib/types";

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (visibility: RoomVisibility) => void;
}

export default function CreateRoomModal({ onClose, onCreate }: CreateRoomModalProps) {
  const [visibility, setVisibility] = useState<RoomVisibility>("private");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-100">Create Room</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Visibility toggle */}
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Room visibility
        </p>
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setVisibility("private")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
              visibility === "private"
                ? "bg-gray-800 border-emerald-600/50 text-emerald-400 shadow-glow-green"
                : "bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300"
            }`}
          >
            <Lock className="h-4 w-4" />
            Private
          </button>
          <button
            onClick={() => setVisibility("public")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
              visibility === "public"
                ? "bg-gray-800 border-emerald-600/50 text-emerald-400 shadow-glow-green"
                : "bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300"
            }`}
          >
            <Globe className="h-4 w-4" />
            Public
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 mb-6">
          {visibility === "private"
            ? "Only people with the link can join this room."
            : "This room will be listed on the main page for anyone to join."}
        </p>

        {/* Create button */}
        <button
          onClick={() => onCreate(visibility)}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <Plus className="h-4 w-4" />
          Create Room
        </button>
      </div>
    </div>
  );
}
