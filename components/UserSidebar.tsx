"use client";

import { useEffect } from "react";
import type { UserPresence } from "@/lib/types";
import { Users, X, Crown } from "lucide-react";

interface UserSidebarProps {
  users: UserPresence[];
  currentUsername: string;
  creator: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSidebar({ users, currentUsername, creator, isOpen, onClose }: UserSidebarProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
            return (
              <li
                key={user.user}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors"
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
                <span className="text-sm text-gray-300 truncate flex-1">
                  {user.user}
                  {isSelf && (
                    <span className="text-gray-600 text-xs ml-1">(you)</span>
                  )}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
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
