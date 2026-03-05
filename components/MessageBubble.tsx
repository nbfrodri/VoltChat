"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Copy, Check, Reply, SmilePlus, X } from "lucide-react";
import type { ChatMessage, MessageReaction } from "@/lib/types";
import type { ChatTheme } from "@/lib/themes";
import { getUserColor, getUserAvatarColor } from "@/lib/utils";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

// Swipe threshold in pixels
const SWIPE_THRESHOLD = 60;

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  opacity?: number;
  isDisintegrating?: boolean;
  disintegrationDelay?: number;
  density?: "comfortable" | "compact";
  grouped?: boolean;
  reactions?: MessageReaction[];
  currentUser?: string;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (message: ChatMessage) => void;
  theme?: ChatTheme;
  readBy?: string[];
}

export default function MessageBubble({
  message,
  isSelf,
  opacity = 1,
  isDisintegrating = false,
  disintegrationDelay = 0,
  density = "comfortable",
  grouped = false,
  reactions = [],
  currentUser,
  onReaction,
  onReply,
  theme,
  readBy = [],
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const initial = message.user.charAt(0).toUpperCase();
  const isCompact = density === "compact";
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const userColor = getUserColor(message.user);

  // Swipe-to-reply state
  const [swipeX, setSwipeX] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const swipingRef = useRef(false);
  const swipeTriggeredRef = useRef(false);

  // Group reactions by emoji
  const reactionGroups = reactions.reduce<Record<string, { count: number; users: string[] }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [] };
    acc[r.emoji].count++;
    acc[r.emoji].users.push(r.user);
    return acc;
  }, {});

  // Mention detection
  const isMentioned = !isSelf && currentUser ? new RegExp(`@${currentUser}(?:\\s|$)`, "i").test(message.text) : false;

  // Render message text with highlighted @mentions
  function renderTextWithMentions(text: string) {
    const parts = text.split(/(@\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const name = part.slice(1);
        const isSelfMention = currentUser && name.toLowerCase() === currentUser.toLowerCase();
        return (
          <span key={i} className={`font-semibold ${isSelfMention ? (theme?.replyAccentText || "text-emerald-300") : getUserColor(name)}`}>
            {part}
          </span>
        );
      }
      return part;
    });
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
    setShowActions(false);
  }

  function handleReply() {
    onReply?.(message);
    setShowActions(false);
  }

  function handleReaction(emoji: string) {
    onReaction?.(message.id, emoji);
    setShowReactionPicker(false);
    setShowActions(false);
  }

  // Long press for mobile (shows copy/react actions)
  const startLongPress = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
    }, 400);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Swipe-to-reply touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    swipingRef.current = false;
    swipeTriggeredRef.current = false;
    // Also start long press timer
    startLongPress();
  }, [startLongPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    // If vertical movement is dominant, cancel swipe
    if (!swipingRef.current && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      touchStartRef.current = null;
      cancelLongPress();
      return;
    }

    // For self messages swipe left (negative), for others swipe right (positive)
    const swipeDir = isSelf ? -dx : dx;

    if (swipeDir > 10) {
      swipingRef.current = true;
      cancelLongPress();
    }

    if (swipingRef.current) {
      const clamped = Math.min(swipeDir, SWIPE_THRESHOLD + 20);
      setSwipeX(isSelf ? -clamped : clamped);

      // Trigger reply at threshold
      if (clamped >= SWIPE_THRESHOLD && !swipeTriggeredRef.current) {
        swipeTriggeredRef.current = true;
        // Haptic-like feedback via a tiny vibration if supported
        if (navigator.vibrate) navigator.vibrate(15);
      }
    }
  }, [isSelf, cancelLongPress]);

  const handleTouchEnd = useCallback(() => {
    cancelLongPress();

    if (swipeTriggeredRef.current && onReply) {
      onReply(message);
    }

    // Animate back
    setSwipeX(0);
    touchStartRef.current = null;
    swipingRef.current = false;
    swipeTriggeredRef.current = false;
  }, [cancelLongPress, onReply, message]);

  // Close actions when clicking outside
  useEffect(() => {
    if (!showActions && !showReactionPicker) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false);
        setShowReactionPicker(false);
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("touchstart", handleClick);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [showActions, showReactionPicker]);

  const isReplyToMe = !isSelf && !!currentUser && !!message.replyTo && message.replyTo.user === currentUser;

  return (
    <div
      role="article"
      aria-label={`Message from ${message.user}: ${message.text}`}
      className={`group/msg relative flex items-end gap-3 ${
        isCompact ? "max-w-[85%]" : "max-w-[80%]"
      } ${isSelf ? "ml-auto flex-row-reverse" : ""} ${
        isSelf ? "animate-slide-in-right" : "animate-slide-in-left"
      } ${isDisintegrating ? "animate-disintegrate" : ""}`}
      style={{
        opacity: isDisintegrating ? undefined : opacity,
        transition: "opacity 2s ease-out",
        animationDelay: isDisintegrating ? `${disintegrationDelay}ms` : undefined,
      }}
    >
      {/* Swipe reply indicator */}
      {swipeX !== 0 && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${isSelf ? "right-full mr-2" : "left-full ml-2"}`}
          style={{ opacity: Math.min(Math.abs(swipeX) / SWIPE_THRESHOLD, 1) }}
        >
          <Reply className={`h-5 w-5 ${Math.abs(swipeX) >= SWIPE_THRESHOLD ? (theme?.headerAccent || "text-emerald-400") : "text-gray-500"}`} />
        </div>
      )}

      {/* Avatar */}
      {grouped ? (
        <div className={isCompact ? "w-6" : "w-9"} />
      ) : (
        <div
          className={`shrink-0 rounded-full flex items-center justify-center font-medium ${
            isCompact ? "w-6 h-6 text-[10px]" : "w-9 h-9 text-sm"
          } ${
            getUserAvatarColor(message.user)
          }`}
        >
          {initial}
        </div>
      )}

      {/* Bubble + actions below */}
      <div
        className={`${isSelf ? "flex flex-col items-end" : "flex flex-col items-start"} min-w-0`}
        style={{
          transform: swipeX !== 0 ? `translateX(${swipeX}px)` : undefined,
          transition: swipeX === 0 ? "transform 0.2s ease-out" : undefined,
        }}
      >
        {!isSelf && !grouped && (
          <span className={`ml-1 mb-1 font-medium ${isCompact ? "text-xs" : "text-sm"} ${userColor}`}>
            {message.user}
          </span>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={`mb-1 ml-1 px-3 py-1.5 rounded-lg border-l-2 ${
            isReplyToMe
              ? `${theme?.replyBorder || "border-emerald-600"} ${theme?.replyBg || "bg-emerald-900/20"} ring-1 ring-offset-1 ring-offset-gray-950 ${theme?.selfReactionBorder || "ring-emerald-700/50"}`
              : isSelf
                ? `${theme?.replyBorder || "border-emerald-600"} ${theme?.replyBg || "bg-emerald-900/20"}`
                : "border-gray-600 bg-gray-800/50"
          }`}>
            <span className={`text-xs font-medium ${
              isReplyToMe
                ? (theme?.replyAccentText || "text-emerald-400")
                : getUserColor(message.replyTo.user)
            }`}>{message.replyTo.user}</span>
            <p className={`text-xs truncate max-w-[200px] ${isReplyToMe ? "text-gray-300" : "text-gray-400"}`}>{message.replyTo.text}</p>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`whitespace-pre-wrap break-words select-text ${
            isCompact ? "px-3 py-1.5 text-sm rounded-lg" : "px-4 py-2 text-base rounded-xl"
          } ${
            isSelf
              ? `${theme?.selfBubbleBg || "bg-emerald-900/60"} border ${theme?.selfBubbleBorder || "border-emerald-700/30"} ${theme?.selfBubbleText || "text-emerald-100"} ${grouped ? "rounded-xl" : "rounded-br-none"}`
              : `bg-gray-800 border border-gray-700/50 text-gray-200 ${grouped ? "rounded-xl" : "rounded-bl-none"}`
          } ${isReplyToMe || isMentioned ? "ring-1 ring-offset-1 ring-offset-gray-950 " + (theme?.selfReactionBorder || "ring-emerald-700/50") : ""}`}
          title="Double-click for actions"
          onDoubleClick={() => setShowActions(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {renderTextWithMentions(message.text)}
          <span className={`inline-block ml-2 text-[10px] align-bottom leading-5 ${
            isSelf ? "text-gray-400/60" : "text-gray-500/60"
          }`}>{time}</span>
        </div>

        {/* Reactions display */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactionGroups).map(([emoji, { count, users }]) => {
              const selfReacted = currentUser ? users.includes(currentUser) : false;
              return (
                <button
                  key={emoji}
                  onClick={() => onReaction?.(message.id, emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                    selfReacted
                      ? `${theme?.selfReactionBg || "bg-emerald-900/30"} ${theme?.selfReactionBorder || "border-emerald-700/50"} ${theme?.selfReactionText || "text-emerald-300"}`
                      : "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600"
                  }`}
                  title={users.join(", ")}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Read receipts */}
        {readBy.length > 0 && (
          <div className={`flex gap-0.5 mt-1 ${isSelf ? "justify-end" : "justify-start"}`}>
            {readBy.slice(0, 5).map((user) => (
              <div
                key={user}
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${getUserAvatarColor(user)}`}
                title={`Seen by ${user}`}
              >
                {user.charAt(0).toUpperCase()}
              </div>
            ))}
            {readBy.length > 5 && (
              <span className="text-[9px] text-gray-500 self-center ml-0.5" title={readBy.slice(5).join(", ")}>
                +{readBy.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Action bar — below the bubble */}
        {showActions && (
          <div ref={actionsRef} className="mt-1">
            <div className="flex items-center gap-0.5 bg-gray-800 border border-gray-700 rounded-xl shadow-lg px-1.5 py-1">
              <button
                onClick={copyText}
                className="p-2 text-gray-400 hover:text-gray-200 active:text-gray-200 transition-colors rounded-lg"
                aria-label="Copy message"
              >
                {copied ? <Check className={`h-4 w-4 ${theme?.activeToggle || "text-emerald-400"}`} /> : <Copy className="h-4 w-4" />}
              </button>
              {onReply && (
                <button
                  onClick={handleReply}
                  className="p-2 text-gray-400 hover:text-gray-200 active:text-gray-200 transition-colors rounded-lg"
                  aria-label="Reply"
                >
                  <Reply className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className="p-2 text-gray-400 hover:text-gray-200 active:text-gray-200 transition-colors rounded-lg"
                aria-label="React"
              >
                <SmilePlus className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setShowActions(false); setShowReactionPicker(false); }}
                className="p-1.5 text-gray-500 hover:text-gray-300 active:text-gray-300 transition-colors rounded-lg"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Reaction picker — below action bar */}
            {showReactionPicker && (
              <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-xl shadow-lg px-2 py-1.5 mt-1">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-700 active:bg-gray-700 text-base transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
