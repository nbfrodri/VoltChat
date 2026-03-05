"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Hash, Bomb, Menu, ChevronDown, LogOut, Globe, Lock, Users, Vote, Palette,
  Settings, X, UserX, Share2, Tags, HelpCircle, MoreVertical,
  AlignJustify, List, Shield, Flag, Timer, ShieldCheck, ZoomIn,
} from "lucide-react";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { getMessageOpacity, getUserColor } from "@/lib/utils";
import { hapticTap, hapticSuccess, hapticWarning } from "@/lib/haptics";
import { filterMessage, type FilterLevel } from "@/lib/content-filter";
import { THEMES, getThemeForRoom, setThemeForRoom, type ChatTheme } from "@/lib/themes";
import type { RoomVisibility, RoomTag, ChatMessage } from "@/lib/types";
import MessageBubble from "@/components/MessageBubble";
import MessageInput from "@/components/MessageInput";
import UserSidebar from "@/components/UserSidebar";
import TypingIndicator from "@/components/TypingIndicator";
import NukeOverlay from "@/components/NukeOverlay";
import SystemMessage from "@/components/SystemMessage";
import TagBadge from "@/components/TagBadge";
import TagManager from "@/components/TagManager";
import ShareModal from "@/components/ShareModal";
import ShortcutsOverlay from "@/components/ShortcutsOverlay";
import ReportModal from "@/components/ReportModal";

interface ChatInterfaceProps {
  roomId: string;
  username: string;
  visibility: RoomVisibility;
  initialMaxUsers?: number;
  initialTags?: RoomTag[];
  encryptionKey?: string | null;
  initialTtl?: number;
}

type Density = "comfortable" | "compact";

export default function ChatInterface({ roomId, username, visibility, initialMaxUsers, initialTags, encryptionKey, initialTtl }: ChatInterfaceProps) {
  const router = useRouter();
  const {
    messages,
    onlineUsers,
    typingUsers,
    isNuking,
    isConnected,
    isCreator,
    creator,
    maxUsers,
    isRoomFull,
    isNameTaken,
    isMuted,
    isKicked,
    kickReason,
    mutedUsers,
    roomTags,
    isEncrypted,
    reactions,
    ttl,
    roomCreatedAt,
    sendMessage,
    sendTyping,
    nukeRoom,
    leaveRoom,
    updateMaxUsers,
    updateTags,
    roomVisibility,
    updateVisibility,
    activeVoteKick,
    toggleReaction,
    kickUser,
    muteUser,
    startVoteKick,
    castVoteKick,
    readReceipts,
    markAsRead,
    spamCooldown,
  } = useChatRoom({ roomId, username, visibility, initialMaxUsers, initialTags, encryptionKey, initialTtl });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<{ focus: () => void }>(null);
  const zoomBtnRef = useRef<HTMLButtonElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasLimit, setHasLimit] = useState(false);
  const [capacityInput, setCapacityInput] = useState(10);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [silencedUsers, setSilencedUsers] = useState<Set<string>>(new Set());
  const [contentFilter, setContentFilter] = useState<FilterLevel | null>(() => {
    if (typeof window === "undefined") return null;
    return (localStorage.getItem("voltchat-content-filter") as FilterLevel) || null;
  });
  const [density, setDensity] = useState<Density>(() => {
    if (typeof window === "undefined") return "comfortable";
    return (localStorage.getItem("voltchat-density") as Density) || "comfortable";
  });
  const [theme, setTheme] = useState<ChatTheme>(() => getThemeForRoom(roomId));
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showZoomPopover, setShowZoomPopover] = useState(false);
  const [chatZoom, setChatZoom] = useState<number>(() => {
    if (typeof window === "undefined") return 100;
    const saved = localStorage.getItem("voltchat-chat-zoom");
    return saved ? Number(saved) : 100;
  });

  // TTL countdown
  const [ttlRemaining, setTtlRemaining] = useState<string | null>(null);

  // Nuke animation phases
  const [nukePhase, setNukePhase] = useState(0);
  const nukeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isNearBottomRef = useRef(true);

  // Mobile virtual keyboard: resize container to visual viewport height
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    // Prevent body scroll when keyboard opens on iOS
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";

    function handleResize() {
      if (chatContainerRef.current) {
        chatContainerRef.current.style.height = `${vv!.height}px`;
      }
    }

    vv.addEventListener("resize", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, []);

  // TTL countdown display
  useEffect(() => {
    if (!ttl || !roomCreatedAt) { setTtlRemaining(null); return; }
    const ttlMs = ttl * 60 * 1000;
    const interval = setInterval(() => {
      const remaining = ttlMs - (Date.now() - roomCreatedAt);
      if (remaining <= 0) {
        setTtlRemaining("Expiring...");
        clearInterval(interval);
        return;
      }
      const hours = Math.floor(remaining / 3600000);
      const mins = Math.floor((remaining % 3600000) / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      if (hours > 0) setTtlRemaining(`${hours}h ${mins}m`);
      else if (mins > 0) setTtlRemaining(`${mins}m ${secs}s`);
      else setTtlRemaining(`${secs}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [ttl, roomCreatedAt]);

  useEffect(() => {
    if (!isNuking) return;
    const t1 = setTimeout(() => setNukePhase(1), 0);
    const t2 = setTimeout(() => setNukePhase(2), 600);
    nukeTimersRef.current = [t1, t2];
    return () => nukeTimersRef.current.forEach(clearTimeout);
  }, [isNuking]);

  const handleNukeComplete = useCallback(() => {
    router.push("/");
  }, [router]);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const markAsReadRef = useRef(markAsRead);
  markAsReadRef.current = markAsRead;

  // Track scroll position
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    function handleScroll() {
      if (!el) return;
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const nearBottom = distFromBottom < 200;
      isNearBottomRef.current = nearBottom;
      setShowScrollBtn(!nearBottom);
      if (nearBottom && messagesRef.current.length > 0 && document.visibilityState === "visible" && document.hasFocus()) {
        const lastReadable = [...messagesRef.current].reverse().find((m) => m.type !== "system");
        if (lastReadable) markAsReadRef.current(lastReadable.id);
      }
    }
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Mark as read when user returns to the tab
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState !== "visible") return;
      const el = scrollContainerRef.current;
      if (!el) return;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (nearBottom && messagesRef.current.length > 0) {
        const lastReadable = [...messagesRef.current].reverse().find((m) => m.type !== "system");
        if (lastReadable) markAsReadRef.current(lastReadable.id);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Auto-scroll + mark as read
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || messages.length === 0) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage.user === username;
    if (nearBottom || isOwnMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      // Mark last non-system message as read (only if window is visible and focused)
      if (document.visibilityState === "visible" && document.hasFocus()) {
        const lastReadable = [...messages].reverse().find((m) => m.type !== "system");
        if (lastReadable) markAsRead(lastReadable.id);
      }
    }
  }, [messages, username, markAsRead]);

  function handleSend(text: string) {
    sendMessage(text, replyingTo || undefined);
    sendTyping(false);
    setReplyingTo(null);
    hapticSuccess();
  }

  function handleInputChange(value: string) {
    sendTyping(value.length > 0);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleLeaveRoom() {
    leaveRoom();
    router.push("/");
  }

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      hapticTap();
    } catch { /* noop */ }
  }

  function toggleDensity() {
    const next = density === "comfortable" ? "compact" : "comfortable";
    setDensity(next);
    localStorage.setItem("voltchat-density", next);
  }

  function changeTheme(themeId: string) {
    const t = THEMES.find((th) => th.id === themeId);
    if (t) {
      setTheme(t);
      setThemeForRoom(roomId, themeId);
    }
    setShowThemePicker(false);
  }

  function toggleContentFilter() {
    if (contentFilter) {
      setContentFilter(null);
      localStorage.removeItem("voltchat-content-filter");
    } else {
      setContentFilter("medium");
      localStorage.setItem("voltchat-content-filter", "medium");
    }
  }

  // Apply content filter and silence filter to messages for display
  const displayMessages = useMemo(() => {
    return messages.map((msg) => {
      if (msg.type === "system") return msg;
      // Silenced user: replace with placeholder
      if (silencedUsers.has(msg.user)) {
        return { ...msg, text: "Message hidden — silenced user", _silenced: true };
      }
      // Sanitize replyTo if the replied-to user is silenced
      let result = msg;
      if (msg.replyTo && silencedUsers.has(msg.replyTo.user)) {
        result = { ...result, replyTo: { ...msg.replyTo, text: "Silenced message" } };
      }
      if (!contentFilter) return result;
      const { filtered } = filterMessage(result.text, contentFilter);
      return { ...result, text: filtered };
    });
  }, [messages, contentFilter, silencedUsers]);

  // Keyboard shortcuts
  const shortcuts = useMemo(
    () => [
      { key: "k", ctrl: true, description: "Focus input", action: () => inputRef.current?.focus() },
      { key: "Escape", description: "Close panels", action: () => {
        setShowSettings(false);
        setShowTagManager(false);
        setShowShareModal(false);
        setShowReportModal(false);
        setShowMoreMenu(false);
        setShowThemePicker(false);
        setSidebarOpen(false);
        setReplyingTo(null);
      }},
      { key: "s", ctrl: true, shift: true, description: "Toggle sidebar", action: () => setSidebarOpen((p) => !p) },
      { key: "c", ctrl: true, shift: true, description: "Copy room ID", action: copyRoomId },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomId]
  );

  const { showHelp, setShowHelp } = useKeyboardShortcuts(shortcuts);

  // Error/status screens
  if (isKicked) {
    const isAfkKick = kickReason === "afk";
    const isVoteKick = kickReason === "votekick";
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-950 px-6">
        <div className="text-center">
          {isAfkKick ? (
            <Timer className="h-12 w-12 text-amber-500/60 mx-auto mb-5" />
          ) : (
            <LogOut className="h-12 w-12 text-red-500/60 mx-auto mb-5" />
          )}
          <h2 className="text-xl font-medium text-gray-100 mb-3">
            {isAfkKick ? "Kicked for inactivity" : isVoteKick ? "Vote-kicked" : "You were kicked"}
          </h2>
          <p className="text-base text-gray-500 mb-8">
            {isAfkKick
              ? "You were removed for being inactive for too long."
              : isVoteKick
                ? "The room voted to remove you."
                : "The room creator removed you from this room."}
          </p>
          <button onClick={() => router.push("/")} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl px-8 py-3.5 text-base font-medium transition-colors">
            Back to lobby
          </button>
        </div>
      </div>
    );
  }

  if (isNameTaken) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-950 px-6">
        <div className="text-center">
          <UserX className="h-12 w-12 text-yellow-500/60 mx-auto mb-5" />
          <h2 className="text-xl font-medium text-gray-100 mb-3">Name already taken</h2>
          <p className="text-base text-gray-500 mb-8">Someone in this room is already using that name.</p>
          <button onClick={() => window.location.reload()} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl px-8 py-3.5 text-base font-medium transition-colors">
            Try another name
          </button>
        </div>
      </div>
    );
  }

  if (isRoomFull) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-950 px-6">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-600 mx-auto mb-5" />
          <h2 className="text-xl font-medium text-gray-100 mb-3">Room is full</h2>
          <p className="text-base text-gray-500 mb-8">This room has reached its maximum capacity.</p>
          <button onClick={() => router.push("/")} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl px-8 py-3.5 text-base font-medium transition-colors">
            Back to lobby
          </button>
        </div>
      </div>
    );
  }

  const isCompact = density === "compact";

  return (
    <div ref={chatContainerRef} className={`flex h-dvh overflow-hidden bg-gray-950 ${nukePhase === 1 ? "animate-shake animate-flash-red" : ""}`}>
      {/* Sidebar */}
      <UserSidebar
        users={onlineUsers}
        currentUsername={username}
        creator={creator}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCreator={isCreator}
        mutedUsers={mutedUsers}
        onKick={(target) => { kickUser(target); hapticWarning(); }}
        onMute={(target, muted) => { muteUser(target, muted); hapticTap(); }}
        onVoteKick={(target) => { startVoteKick(target); hapticTap(); }}
        hasActiveVote={!!activeVoteKick}
        silencedUsers={silencedUsers}
        onSilence={(target) => {
          setSilencedUsers((prev) => {
            const next = new Set(prev);
            if (next.has(target)) next.delete(target);
            else next.add(target);
            return next;
          });
          hapticTap();
        }}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur relative z-30">
          {/* Connection status bar */}
          <div className={`h-0.5 transition-colors ${isConnected ? theme.connectionBar : "bg-yellow-500 animate-pulse"}`} />

          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => { setSidebarOpen(true); hapticTap(); }}
                className="md:hidden p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              {roomVisibility === "public" ? (
                <span title="Public room" className="shrink-0">
                  <Globe className={`h-4 w-4 ${theme.headerAccent}`} />
                </span>
              ) : (
                <>
                  <Hash className="h-5 w-5 text-gray-600 shrink-0" />
                  <span className={`text-base ${theme.headerAccent} truncate font-medium`}>{roomId}</span>
                  <span title="Private room" className="shrink-0">
                    <Lock className="h-4 w-4 text-gray-500" />
                  </span>
                </>
              )}
              {isEncrypted && (
                <span title="End-to-end encrypted" className="shrink-0">
                  <ShieldCheck className={`h-4 w-4 ${theme.headerIcon}`} />
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-gray-400 shrink-0">
                <Users className="h-4 w-4" />
                {onlineUsers.length}{maxUsers ? `/${maxUsers}` : ""}
              </span>
              {ttlRemaining && (
                <span className={`flex items-center gap-1 text-xs shrink-0 ${
                  ttlRemaining.includes("s") && !ttlRemaining.includes("m") ? "text-red-400" : "text-gray-500"
                }`}>
                  <Timer className="h-3.5 w-3.5" />
                  {ttlRemaining}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Share — always visible */}
              <button
                onClick={() => { setShowShareModal(true); hapticTap(); }}
                className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg"
                aria-label="Share room"
                title="Share room"
              >
                <Share2 className="h-5 w-5" />
              </button>

              {/* Desktop-only buttons */}
              <button
                onClick={toggleContentFilter}
                className={`hidden md:flex p-2 transition-colors rounded-lg ${contentFilter ? theme.activeToggle : "text-gray-400 hover:text-gray-200"}`}
                aria-label={contentFilter ? "Disable content filter" : "Enable content filter"}
                title={contentFilter ? "Content filter: ON" : "Content filter: OFF"}
              >
                <Shield className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="hidden md:flex p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg"
                aria-label="Report room"
                title="Report room"
              >
                <Flag className="h-5 w-5" />
              </button>
              {isCreator && roomVisibility === "public" && (
                <button
                  onClick={() => setShowTagManager(true)}
                  className="hidden md:flex p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg"
                  aria-label="Manage tags"
                  title="Manage tags"
                >
                  <Tags className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="hidden md:flex p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg"
                aria-label="Change theme"
                title="Change theme"
              >
                <Palette className="h-5 w-5" />
              </button>
              <button
                onClick={toggleDensity}
                className="hidden md:flex p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg"
                aria-label={`Switch to ${isCompact ? "comfortable" : "compact"} density`}
                title={`${isCompact ? "Comfortable" : "Compact"} mode`}
              >
                {isCompact ? <AlignJustify className="h-5 w-5" /> : <List className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg"
                aria-label="Help guide"
                title="Help (?)"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <button
                ref={zoomBtnRef}
                onClick={() => setShowZoomPopover(!showZoomPopover)}
                className={`hidden md:flex p-2 transition-colors rounded-lg ${chatZoom !== 100 ? theme.activeToggle : "text-gray-400 hover:text-gray-200"}`}
                aria-label="Zoom"
                title={`Zoom: ${chatZoom}%`}
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              {isCreator && (
                <button
                  onClick={() => {
                    setHasLimit(!!maxUsers);
                    setCapacityInput(maxUsers || Math.max(10, onlineUsers.length));
                    setShowSettings(!showSettings);
                  }}
                  className="hidden md:flex p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg"
                  aria-label="Room settings"
                  title="Room settings"
                >
                  <Settings className="h-5 w-5" />
                </button>
              )}

              {/* Mobile "more" menu */}
              <div className="relative md:hidden">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg"
                  aria-label="More options"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              {/* Nuke (creator) — always visible */}
              {isCreator && (
                <button
                  onClick={() => { nukeRoom(); hapticWarning(); }}
                  disabled={isNuking}
                  className="flex items-center gap-1 text-red-500 hover:text-red-400 disabled:opacity-40 text-sm uppercase tracking-wider transition-colors p-2 rounded-lg"
                >
                  <Bomb className="h-5 w-5" />
                  <span className="hidden sm:inline font-medium">Nuke</span>
                </button>
              )}

              {/* Leave — always visible */}
              <button
                onClick={handleLeaveRoom}
                className="flex items-center gap-1 text-gray-400 hover:text-gray-200 text-sm uppercase tracking-wider transition-colors p-2 rounded-lg"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">Leave</span>
              </button>
            </div>
          </div>

          {/* E2EE banner */}
          {isEncrypted && (
            <div className="px-4 pb-2">
              <div className={`flex items-center gap-2 ${theme.e2eeBannerBg} border ${theme.e2eeBannerBorder} rounded-lg px-3 py-1.5`}>
                <ShieldCheck className={`h-3.5 w-3.5 ${theme.headerIcon} shrink-0`} />
                <span className={`text-xs ${theme.e2eeBannerText}`}>End-to-end encrypted — only people with the full link can read messages</span>
              </div>
            </div>
          )}

          {/* Tags row */}
          {roomTags.length > 0 && (
            <div className="px-4 pb-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
              {roomTags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
            </div>
          )}
        </header>

        {/* Vote kick banner */}
        {activeVoteKick && (() => {
          const othersCount = onlineUsers.filter(
            (u) => u.user !== creator && u.user !== activeVoteKick.target && u.user !== activeVoteKick.initiator
          ).length;
          const required = 1 + Math.ceil(othersCount / 2);
          const canVote = activeVoteKick.target !== username
            && username !== creator
            && !activeVoteKick.votesYes.includes(username)
            && !activeVoteKick.votesNo.includes(username);
          const hasVoted = (activeVoteKick.votesYes.includes(username) || activeVoteKick.votesNo.includes(username))
            && activeVoteKick.target !== username;

          return (
            <div className="px-4 py-2.5 bg-amber-900/20 border-b border-amber-800/30 flex items-center gap-3">
              <Vote className="h-4 w-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-amber-300">
                  Vote to kick <strong>{activeVoteKick.target}</strong>
                </span>
                <span className="text-xs text-amber-400/60 ml-2">
                  {activeVoteKick.votesYes.length} yes / {activeVoteKick.votesNo.length} no
                  {" "}(need {required})
                </span>
              </div>
              {canVote && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => castVoteKick(activeVoteKick.target, "yes")}
                    className="px-3 py-1.5 text-xs font-medium bg-red-900/40 border border-red-800/50 text-red-300 rounded-lg hover:bg-red-900/60 transition-colors"
                  >
                    Kick
                  </button>
                  <button
                    onClick={() => castVoteKick(activeVoteKick.target, "no")}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Keep
                  </button>
                </div>
              )}
              {hasVoted && <span className="text-xs text-amber-400/50 shrink-0">Voted</span>}
              {username === creator && <span className="text-xs text-gray-500 shrink-0">Creator can&apos;t vote</span>}
            </div>
          );
        })()}

        {/* Messages */}
        <div className="relative flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Chat messages"
            className="h-full overflow-y-auto px-4 md:px-6 py-6 scrollbar-hide"
            style={{ zoom: chatZoom / 100 }}
          >
            {displayMessages.length === 0 && (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-gray-600 text-base italic">The void awaits...</p>
              </div>
            )}
            <div className={isCompact ? "space-y-1.5" : "space-y-4"}>
              {(() => {
                // Build readBy map: messageId → users who have read up to exactly this message
                const readByMap: Record<string, string[]> = {};
                for (const [user, msgId] of Object.entries(readReceipts)) {
                  if (user === username) continue; // Don't show own avatar
                  if (!readByMap[msgId]) readByMap[msgId] = [];
                  readByMap[msgId].push(user);
                }
                return displayMessages.map((msg, index) => {
                const prevMsg = index > 0 ? displayMessages[index - 1] : null;
                const isGrouped = isCompact && prevMsg && prevMsg.user === msg.user && prevMsg.type === "message" && msg.type === "message";
                const msgReactions = reactions.filter((r) => r.messageId === msg.id);
                const readBy = readByMap[msg.id] || [];

                const isSilenced = silencedUsers.has(msg.user);

                if (msg.type === "system") {
                  return <SystemMessage key={msg.id} message={msg} />;
                }

                if (isSilenced) {
                  return (
                    <div key={msg.id} className={`flex ${msg.user === username ? "justify-end" : "justify-start"} max-w-[80%] ${msg.user === username ? "ml-auto" : ""}`}>
                      <span className="text-xs text-gray-600 italic px-4 py-1.5">Silenced message</span>
                    </div>
                  );
                }

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isSelf={msg.user === username}
                    opacity={getMessageOpacity(index, displayMessages.length)}
                    isDisintegrating={nukePhase >= 2}
                    disintegrationDelay={Math.min(index * 40, 400)}
                    density={density}
                    grouped={!!isGrouped}
                    reactions={msgReactions}
                    currentUser={username}
                    onReaction={toggleReaction}
                    theme={theme}
                    readBy={readBy}
                    onReply={(m) => {
                      // Find original (unfiltered) message for reply
                      const original = messages.find((om) => om.id === m.id);
                      setReplyingTo(original || m);
                      inputRef.current?.focus();
                    }}
                  />
                );
              });
              })()}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button
              onClick={scrollToBottom}
              className={`absolute bottom-5 right-5 w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 ${theme.scrollButtonHover} hover:bg-gray-700 transition-colors shadow-lg`}
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} theme={theme} />

        {/* Reply indicator */}
        {replyingTo && (
          <div className="px-4 py-2 border-t border-gray-800 bg-gray-900/60 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-xs text-gray-500">Replying to </span>
              <span className={`text-xs ${getUserColor(replyingTo.user)} font-medium`}>{replyingTo.user}</span>
              <p className="text-xs text-gray-400 truncate">{replyingTo.text}</p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 text-gray-500 hover:text-gray-300 shrink-0"
              aria-label="Cancel reply"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Input */}
        {spamCooldown > 0 && (
          <div className="px-4 py-2 border-t border-red-800/30 bg-red-900/20 text-center">
            <span className="text-xs text-red-400">Slow down! You can send again in {Math.ceil(spamCooldown / 1000)}s</span>
          </div>
        )}
        {isMuted ? (
          <div className="px-5 py-4 border-t border-gray-800 bg-gray-900/80">
            <p className="text-center text-base text-red-400/70">You are muted by the room creator</p>
          </div>
        ) : (
          <MessageInput
            ref={inputRef}
            onSend={handleSend}
            onTyping={handleInputChange}
            disabled={isNuking || !isConnected || spamCooldown > 0}
            theme={theme}
            onlineUsers={onlineUsers.map((u) => u.user)}
            currentUser={username}
          />
        )}
      </div>

      {/* Settings modal */}
      {showSettings && isCreator && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}
        >
          <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm text-gray-300 uppercase tracking-wider font-medium">Room settings</span>
              <button onClick={() => setShowSettings(false)} className="p-1 text-gray-500 hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Visibility toggle — hidden for E2EE rooms */}
            {!isEncrypted && (
              <div className="mb-5 pb-5 border-b border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {roomVisibility === "public" ? (
                      <Globe className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-base text-gray-200">{roomVisibility === "public" ? "Public" : "Private"}</span>
                  </div>
                  <button
                    onClick={() => updateVisibility(roomVisibility === "public" ? "private" : "public")}
                    className={`relative w-11 h-6 rounded-full transition-colors ${roomVisibility === "public" ? theme.toggleBg : "bg-gray-700"}`}
                    aria-label="Toggle room visibility"
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${roomVisibility === "public" ? "translate-x-5" : ""}`} />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {roomVisibility === "public" ? "Room appears in the public lobby" : "Room is link-only, hidden from lobby"}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mb-5">
              <span className="text-base text-gray-200">Enable limit</span>
              <button
                onClick={() => {
                  const next = !hasLimit;
                  setHasLimit(next);
                  if (!next) {
                    updateMaxUsers(undefined);
                  } else {
                    const clamped = Math.max(Math.max(2, onlineUsers.length), Math.min(50, capacityInput));
                    setCapacityInput(clamped);
                    updateMaxUsers(clamped);
                  }
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${hasLimit ? theme.toggleBg : "bg-gray-700"}`}
                aria-label="Toggle user limit"
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${hasLimit ? "translate-x-5" : ""}`} />
              </button>
            </div>
            {hasLimit && (
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={Math.max(2, onlineUsers.length)}
                  max={50}
                  value={capacityInput}
                  onChange={(e) => { const val = Number(e.target.value); setCapacityInput(val); updateMaxUsers(val); }}
                  className="flex-1 h-2"
                  style={{ accentColor: theme.accentHex }}
                />
                <span className="text-base text-gray-200 w-10 text-right tabular-nums font-medium">{capacityInput}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tag Manager */}
      <TagManager
        tags={roomTags}
        onTagsChange={updateTags}
        isOpen={showTagManager && isCreator}
        onClose={() => setShowTagManager(false)}
      />

      {/* Share Modal */}
      <ShareModal
        roomId={roomId}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Report Modal */}
      <ReportModal
        roomId={roomId}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onTerminate={() => {
          // Room terminated by reports — nuke for this user
          leaveRoom();
          router.push("/");
        }}
      />

      {/* Zoom popover (fixed, outside header stacking context) */}
      {showZoomPopover && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setShowZoomPopover(false)} />
          <div
            className="fixed z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-3 w-56"
            style={{
              top: zoomBtnRef.current ? zoomBtnRef.current.getBoundingClientRect().bottom + 8 : 60,
              right: 16,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Chat Zoom</span>
              <button
                onClick={() => { setChatZoom(100); localStorage.setItem("voltchat-chat-zoom", "100"); }}
                className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => { const n = Math.max(50, chatZoom - 10); setChatZoom(n); localStorage.setItem("voltchat-chat-zoom", String(n)); }}
                disabled={chatZoom <= 50}
                className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold border border-gray-700"
              >
                −
              </button>
              <span className="flex-1 text-center text-sm text-gray-200 font-medium tabular-nums">{chatZoom}%</span>
              <button
                onClick={() => { const n = Math.min(200, chatZoom + 10); setChatZoom(n); localStorage.setItem("voltchat-chat-zoom", String(n)); }}
                disabled={chatZoom >= 200}
                className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold border border-gray-700"
              >
                +
              </button>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              step={10}
              value={chatZoom}
              onChange={(e) => { const n = Number(e.target.value); setChatZoom(n); localStorage.setItem("voltchat-chat-zoom", String(n)); }}
              className="w-full h-1.5 mb-3"
              style={{ accentColor: theme.accentHex }}
            />
          </div>
        </>
      )}

      {/* Mobile more menu overlay */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setShowMoreMenu(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 rounded-t-2xl p-2 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-3" />
            <button
              onClick={() => { setShowThemePicker(true); setShowMoreMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 active:bg-gray-700 rounded-xl transition-colors"
            >
              <Palette className="h-5 w-5" />
              Change theme
            </button>
            <button
              onClick={() => { toggleContentFilter(); setShowMoreMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 active:bg-gray-700 rounded-xl transition-colors"
            >
              <Shield className={`h-5 w-5 ${contentFilter ? theme.activeToggle : ""}`} />
              {contentFilter ? "Content filter: ON" : "Content filter"}
            </button>
            <button
              onClick={() => { setShowReportModal(true); setShowMoreMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 active:bg-gray-700 rounded-xl transition-colors"
            >
              <Flag className="h-5 w-5" />
              Report room
            </button>
            {isCreator && roomVisibility === "public" && (
              <button
                onClick={() => { setShowTagManager(true); setShowMoreMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 active:bg-gray-700 rounded-xl transition-colors"
              >
                <Tags className="h-5 w-5" />
                Manage tags
              </button>
            )}
            {isCreator && (
              <button
                onClick={() => {
                  setHasLimit(!!maxUsers);
                  setCapacityInput(maxUsers || Math.max(10, onlineUsers.length));
                  setShowSettings(true);
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 active:bg-gray-700 rounded-xl transition-colors"
              >
                <Settings className="h-5 w-5" />
                Room settings
              </button>
            )}
          </div>
        </div>
      )}

      {/* Theme picker */}
      {showThemePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowThemePicker(false); }}
        >
          <div className="w-full max-w-xs bg-gray-800 border border-gray-700 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-200">Chat Theme</span>
              <button onClick={() => setShowThemePicker(false)} className="p-1 text-gray-500 hover:text-gray-300">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => changeTheme(t.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                    theme.id === t.id
                      ? "border-white/30 bg-gray-700/50 scale-105 ring-1 ring-white/10"
                      : "border-gray-700 bg-gray-900 hover:border-gray-600"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: t.accentHex }}
                  />
                  <span className="text-[10px] text-gray-400">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Help guide */}
      <ShortcutsOverlay isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Nuke overlay */}
      {isNuking && <NukeOverlay onComplete={handleNukeComplete} />}
    </div>
  );
}
