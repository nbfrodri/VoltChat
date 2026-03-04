"use client";

import { useEffect, useState } from "react";
import type { UserPresence } from "@/lib/types";
import { Users, X, Crown, Ban, VolumeX, Volume2 } from "lucide-react";

interface UserSidebarProps {
  users: UserPresence[];
  currentUsername: string;
  creator: string | null;
  isOpen: boolean;
  onClose: () => void;
  isCreator: boolean;
  mutedUsers: Set<string>;
  onKick: (target: string) => void;
  onMute: (target: string, muted: boolean) => void;
}

export default function UserSidebar({
  users,
  currentUsername,
  creator,
  isOpen,
  onClose,
  isCreator,
  mutedUsers,
  onKick,
  onMute,
}: UserSidebarProps) {
  const [confirmKick, setConfirmKick] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset confirm state when sidebar closes
  useEffect(() => {
    if (!isOpen) setConfirmKick(null);
  }, [isOpen]);

  return (
    <>
      {/* Backdrop (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-40 md:z-auto flex flex-col w-64 shrink-0 bg-gray-900 border-r border-gray-800 h-full transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <h2 className="text-xs text-gray-500 uppercase tracking-wider">
              Ghosts Online
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-600/20 text-emerald-400 text-xs rounded-full px-2 py-0.5">
              {users.length}
            </span>
            <button
              onClick={onClose}
              className="md:hidden p-1 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* User list */}
        <ul className="flex-1 overflow-y-auto p-2 space-y-1">
          {users.map((user) => {
            const isSelf = user.user === currentUsername;
            const isRoomCreator = user.user === creator;
            const isUserMuted = mutedUsers.has(user.user);
            const isConfirmingKick = confirmKick === user.user;

            return (
              <li
                key={user.user}
                className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isSelf
                      ? "bg-emerald-900 text-emerald-300"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {user.user.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-300 truncate block">
                    {user.user}
                    {isSelf && (
                      <span className="text-gray-600 text-xs ml-1">(you)</span>
                    )}
                  </span>
                  {isUserMuted && (
                    <span className="text-xs text-red-400/70">muted</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Moderation buttons (creator only, not on self) */}
                  {isCreator && !isSelf && !isRoomCreator && (
                    <>
                      {isConfirmingKick ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onKick(user.user);
                              setConfirmKick(null);
                            }}
                            className="text-[10px] text-red-400 hover:text-red-300 bg-red-900/30 px-1.5 py-0.5 rounded transition-colors"
                            title="Confirm kick"
                          >
                            Kick?
                          </button>
                          <button
                            onClick={() => setConfirmKick(null)}
                            className="text-[10px] text-gray-500 hover:text-gray-300 px-1 py-0.5 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => onMute(user.user, !isUserMuted)}
                            className="p-1 text-gray-600 hover:text-gray-300 md:opacity-0 md:group-hover:opacity-100 transition-all"
                            aria-label={isUserMuted ? "Unmute user" : "Mute user"}
                            title={isUserMuted ? "Unmute" : "Mute"}
                          >
                            {isUserMuted ? (
                              <Volume2 className="h-3.5 w-3.5" />
                            ) : (
                              <VolumeX className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmKick(user.user)}
                            className="p-1 text-gray-600 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all"
                            aria-label="Kick user"
                            title="Kick"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {isRoomCreator && (
                    <span title="Room creator">
                      <Crown className="h-3 w-3 text-yellow-500" />
                    </span>
                  )}
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
