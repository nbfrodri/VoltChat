"use client";

import { useEffect, useState } from "react";
import type { UserPresence } from "@/lib/types";
import { Users, Crown, Ban, VolumeX, Volume2, ChevronDown, ChevronUp, Vote, EyeOff, Eye } from "lucide-react";
import BottomSheet from "@/components/BottomSheet";
import { getUserColor, getUserAvatarColor } from "@/lib/utils";

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
  onVoteKick?: (target: string) => void;
  hasActiveVote?: boolean;
  silencedUsers?: Set<string>;
  onSilence?: (target: string) => void;
}

function UserList({
  users,
  currentUsername,
  creator,
  isCreator,
  mutedUsers,
  onKick,
  onMute,
  onVoteKick,
  hasActiveVote,
  silencedUsers,
  onSilence,
}: Omit<UserSidebarProps, "isOpen" | "onClose">) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [confirmKick, setConfirmKick] = useState<string | null>(null);

  return (
    <ul className="flex-1 overflow-y-auto p-3 space-y-1">
      {users.map((user) => {
        const isSelf = user.user === currentUsername;
        const isRoomCreator = user.user === creator;
        const isUserMuted = mutedUsers.has(user.user);
        const isExpanded = expandedUser === user.user;
        const isConfirmingKick = confirmKick === user.user;
        const canModerate = isCreator && !isSelf && !isRoomCreator;
        // Non-creators can vote-kick other non-creators (not the room creator)
        const canVoteKick = !isCreator && !isSelf && !isRoomCreator && onVoteKick;
        const canInteract = !isSelf;
        const isAfk = user.lastActivity ? (Date.now() - user.lastActivity >= 5 * 60 * 1000) : false;
        const isSilenced = silencedUsers?.has(user.user) ?? false;

        return (
          <li key={user.user}>
            <div
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                canInteract ? "cursor-pointer active:bg-gray-800/70" : ""
              } ${isExpanded ? "bg-gray-800/60" : "hover:bg-gray-800/40"} ${isAfk ? "opacity-60" : ""}`}
              onClick={() => {
                if (canInteract) {
                  setExpandedUser(isExpanded ? null : user.user);
                  setConfirmKick(null);
                }
              }}
            >
              <div
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base font-medium ${getUserAvatarColor(user.user)}`}
              >
                {user.user.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm truncate block font-medium ${getUserColor(user.user)}`}>
                  {user.user}
                  {isSelf && <span className="text-gray-500 text-xs ml-1.5">(you)</span>}
                </span>
                {isUserMuted && <span className="text-xs text-red-400/80">muted</span>}
                {isSilenced && !isUserMuted && <span className="text-xs text-gray-500">silenced</span>}
                {isAfk && !isUserMuted && !isSilenced && <span className="text-xs text-amber-400/80">afk</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isRoomCreator && (
                  <span title="Room creator">
                    <Crown className="h-4 w-4 text-yellow-500" />
                  </span>
                )}
                <span className={`w-2.5 h-2.5 rounded-full ${isAfk ? "bg-amber-500" : "bg-emerald-500"}`} title={isAfk ? "Away" : "Online"} />
                {canInteract && (
                  isExpanded
                    ? <ChevronUp className="h-4 w-4 text-gray-500" />
                    : <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </div>
            </div>

            {/* Expanded moderation actions (creator) */}
            {isExpanded && canModerate && (
              <div className="flex gap-2 px-3 py-2">
                {isConfirmingKick ? (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={(e) => { e.stopPropagation(); onKick(user.user); setExpandedUser(null); setConfirmKick(null); }}
                      className="flex-1 text-sm text-red-400 bg-red-900/30 border border-red-800/50 px-4 py-2.5 rounded-xl font-medium transition-colors hover:bg-red-900/50"
                    >
                      Confirm Kick
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmKick(null); }}
                      className="flex-1 text-sm text-gray-400 bg-gray-800 border border-gray-700 px-4 py-2.5 rounded-xl transition-colors hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onMute(user.user, !isUserMuted); setExpandedUser(null); }}
                        className="flex-1 flex items-center justify-center gap-2 text-sm text-gray-300 bg-gray-800 border border-gray-700 px-4 py-2.5 rounded-xl transition-colors hover:bg-gray-700"
                      >
                        {isUserMuted ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        {isUserMuted ? "Unmute" : "Mute"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmKick(user.user); }}
                        className="flex-1 flex items-center justify-center gap-2 text-sm text-red-400 bg-gray-800 border border-red-800/40 px-4 py-2.5 rounded-xl transition-colors hover:bg-red-900/20"
                      >
                        <Ban className="h-4 w-4" />
                        Kick
                      </button>
                    </div>
                    {onSilence && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onSilence(user.user); setExpandedUser(null); }}
                        className={`flex items-center justify-center gap-2 text-sm bg-gray-800 border px-4 py-2.5 rounded-xl transition-colors ${
                          isSilenced
                            ? "text-gray-300 border-gray-600 hover:bg-gray-700"
                            : "text-gray-400 border-gray-700 hover:bg-gray-700"
                        }`}
                      >
                        {isSilenced ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {isSilenced ? "Unsilence" : "Silence"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Vote kick + silence action (non-creator users) */}
            {isExpanded && !canModerate && canInteract && (
              <div className="flex flex-col items-center gap-2 px-3 py-2">
                {onSilence && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSilence(user.user); setExpandedUser(null); }}
                    className={`w-full flex items-center justify-center gap-2 text-sm bg-gray-800 border px-4 py-2.5 rounded-xl transition-colors ${
                      isSilenced
                        ? "text-gray-300 border-gray-600 hover:bg-gray-700"
                        : "text-gray-400 border-gray-700 hover:bg-gray-700"
                    }`}
                  >
                    {isSilenced ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {isSilenced ? "Unsilence" : "Silence"}
                  </button>
                )}
                {canVoteKick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVoteKick!(user.user);
                      setExpandedUser(null);
                    }}
                    disabled={hasActiveVote}
                    className="w-full flex items-center justify-center gap-2 text-sm text-amber-400 bg-gray-800 border border-amber-800/40 px-4 py-2.5 rounded-xl transition-colors hover:bg-amber-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Vote className="h-4 w-4" />
                    {hasActiveVote ? "Vote in progress" : "Vote Kick"}
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
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
  onVoteKick,
  hasActiveVote,
  silencedUsers,
  onSilence,
}: UserSidebarProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const listProps = { users, currentUsername, creator, isCreator, mutedUsers, onKick, onMute, onVoteKick, hasActiveVote, silencedUsers, onSilence };

  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <BottomSheet isOpen={isOpen} onClose={onClose} title={`Users Online (${users.length})`}>
        <UserList {...listProps} />
      </BottomSheet>

      {/* Desktop: Fixed sidebar */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 bg-gray-900 border-r border-gray-800 h-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <h2 className="text-sm text-gray-400 uppercase tracking-wider font-medium">Users Online</h2>
          </div>
          <span className="bg-emerald-600/20 text-emerald-400 text-sm rounded-full px-2.5 py-0.5 font-medium">
            {users.length}
          </span>
        </div>
        <UserList {...listProps} />
      </aside>
    </>
  );
}
