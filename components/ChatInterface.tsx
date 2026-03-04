"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Hash, Bomb, Menu, ChevronDown, Copy, Check, LogOut, Globe, Lock, Users, Settings, X } from "lucide-react";
import { useChatRoom } from "@/hooks/useChatRoom";
import { getMessageOpacity } from "@/lib/utils";
import type { RoomVisibility } from "@/lib/types";
import MessageBubble from "@/components/MessageBubble";
import MessageInput from "@/components/MessageInput";
import UserSidebar from "@/components/UserSidebar";
import TypingIndicator from "@/components/TypingIndicator";
import NukeOverlay from "@/components/NukeOverlay";
import SystemMessage from "@/components/SystemMessage";

interface ChatInterfaceProps {
  roomId: string;
  username: string;
  visibility: RoomVisibility;
  initialMaxUsers?: number;
}

export default function ChatInterface({ roomId, username, visibility, initialMaxUsers }: ChatInterfaceProps) {
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
    isMuted,
    isKicked,
    mutedUsers,
    sendMessage,
    sendTyping,
    nukeRoom,
    leaveRoom,
    updateMaxUsers,
    kickUser,
    muteUser,
  } = useChatRoom({ roomId, username, visibility, initialMaxUsers });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [capacityInput, setCapacityInput] = useState<string>("");

  // Nuke animation phases
  const [nukePhase, setNukePhase] = useState(0);
  const nukeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  // Track scroll position for scroll-to-bottom button
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    function handleScroll() {
      if (!el) return;
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 200);
    }
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || messages.length === 0) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage.user === username;

    if (nearBottom || isOwnMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, username]);

  function handleSend(text: string) {
    sendMessage(text);
    sendTyping(false);
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
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API not available
    }
  }

  // Kicked screen
  if (isKicked) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <LogOut className="h-10 w-10 text-red-500/60 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-100 mb-2">You were kicked</h2>
          <p className="text-sm text-gray-500 mb-6">
            The room creator removed you from this room.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl px-6 py-3 text-sm font-medium transition-colors"
          >
            Back to lobby
          </button>
        </div>
      </div>
    );
  }

  // Room full screen
  if (isRoomFull) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <Users className="h-10 w-10 text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-100 mb-2">Room is full</h2>
          <p className="text-sm text-gray-500 mb-6">
            This room has reached its maximum capacity.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl px-6 py-3 text-sm font-medium transition-colors"
          >
            Back to lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-dvh bg-gray-950 ${
        nukePhase === 1 ? "animate-shake animate-flash-red" : ""
      }`}
    >
      {/* Sidebar */}
      <UserSidebar
        users={onlineUsers}
        currentUsername={username}
        creator={creator}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCreator={isCreator}
        mutedUsers={mutedUsers}
        onKick={kickUser}
        onMute={muteUser}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            {visibility === "private" && (
              <>
                <Hash className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-emerald-400">{roomId}</span>
              </>
            )}
            <span title={visibility === "public" ? "Public room" : "Private room"}>
              {visibility === "public" ? (
                <Globe className="h-3 w-3 text-gray-600" />
              ) : (
                <Lock className="h-3 w-3 text-gray-600" />
              )}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3 w-3" />
              {onlineUsers.length}{maxUsers ? `/${maxUsers}` : ""}
            </span>
            <span
              className={`w-2 h-2 rounded-full ml-1 ${
                isConnected ? "bg-emerald-500" : "bg-yellow-500 animate-pulse"
              }`}
              title={isConnected ? "Connected" : "Connecting..."}
            />
            {visibility === "private" && (
              <button
                onClick={copyRoomId}
                className="p-1 text-gray-600 hover:text-gray-300 transition-colors"
                aria-label="Copy room ID"
                title="Copy room ID"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isCreator && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSettings(!showSettings);
                    setCapacityInput(maxUsers ? String(maxUsers) : "");
                  }}
                  className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label="Room settings"
                  title="Room settings"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
                {showSettings && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-lg z-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">User limit</span>
                      <button
                        onClick={() => setShowSettings(false)}
                        className="p-0.5 text-gray-500 hover:text-gray-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={onlineUsers.length}
                        max={50}
                        value={capacityInput}
                        onChange={(e) => setCapacityInput(e.target.value)}
                        placeholder="No limit"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          const val = Number(capacityInput);
                          if (val >= onlineUsers.length && val <= 50) {
                            updateMaxUsers(val);
                            setShowSettings(false);
                          }
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg py-1.5 transition-colors"
                      >
                        Set
                      </button>
                      <button
                        onClick={() => {
                          updateMaxUsers(undefined);
                          setCapacityInput("");
                          setShowSettings(false);
                        }}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg py-1.5 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {isCreator && (
              <button
                onClick={nukeRoom}
                disabled={isNuking}
                className="flex items-center gap-1.5 text-red-500 hover:text-red-400 disabled:opacity-40 text-xs uppercase tracking-wider transition-colors"
              >
                <Bomb className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Nuke</span>
              </button>
            )}
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs uppercase tracking-wider transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="relative flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Chat messages"
            className="h-full overflow-y-auto px-4 py-6 space-y-3 scrollbar-hide"
          >
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-600 text-sm italic">
                  The void awaits...
                </p>
              </div>
            )}
            {messages.map((msg, index) =>
              msg.type === "system" ? (
                <SystemMessage key={msg.id} message={msg} />
              ) : (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isSelf={msg.user === username}
                  opacity={getMessageOpacity(index, messages.length)}
                  isDisintegrating={nukePhase >= 2}
                  disintegrationDelay={Math.min(index * 40, 400)}
                />
              )
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors shadow-lg"
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} />

        {/* Input */}
        {isMuted ? (
          <div className="px-4 py-3 border-t border-gray-800 bg-gray-900/80">
            <p className="text-center text-sm text-red-400/70">
              You are muted by the room creator
            </p>
          </div>
        ) : (
          <MessageInput
            onSend={handleSend}
            onTyping={handleInputChange}
            disabled={isNuking || !isConnected}
          />
        )}
      </div>

      {/* Nuke overlay */}
      {isNuking && <NukeOverlay onComplete={handleNukeComplete} />}
    </div>
  );
}
