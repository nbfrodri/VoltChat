"use client";

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";
import { Send, Smile } from "lucide-react";
import type { EmojiClickData } from "emoji-picker-react";
import { Theme } from "emoji-picker-react";
import type { ChatTheme } from "@/lib/themes";
import { getUserColor } from "@/lib/utils";

const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-[320px] h-[400px] bg-gray-800 rounded-xl animate-pulse" />
    ),
  }
);

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping?: (value: string) => void;
  disabled?: boolean;
  theme?: ChatTheme;
  onlineUsers?: string[];
  currentUser?: string;
}

const MessageInput = forwardRef<{ focus: () => void }, MessageInputProps>(
  function MessageInput({ onSend, onTyping, disabled, theme, onlineUsers = [], currentUser }, ref) {
    const [value, setValue] = useState("");
    const [showEmojis, setShowEmojis] = useState(false);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const mentionRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    // Auto-focus on mount
    useEffect(() => {
      textareaRef.current?.focus();
    }, []);

    // Close picker on outside click
    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
          setShowEmojis(false);
        }
      }
      if (showEmojis) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojis]);

    // Auto-resize textarea
    const adjustHeight = useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`; // max ~4 lines
    }, []);

    useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    function handleSubmit(e?: React.FormEvent) {
      e?.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setValue("");
      setShowEmojis(false);
      setMentionQuery(null);
      textareaRef.current?.focus();
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
      // Mention navigation
      if (mentionQuery !== null && mentionMatches.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setMentionIndex((i) => (i + 1) % mentionMatches.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setMentionIndex((i) => (i - 1 + mentionMatches.length) % mentionMatches.length);
          return;
        }
        if (e.key === "Tab" || e.key === "Enter") {
          e.preventDefault();
          insertMention(mentionMatches[mentionIndex]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setMentionQuery(null);
          return;
        }
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }

    function handleEmojiClick(emojiData: EmojiClickData) {
      setValue((prev) => prev + emojiData.emoji);
      onTyping?.(value + emojiData.emoji);
      textareaRef.current?.focus();
    }

    // Mention autocomplete logic
    const mentionMatches = mentionQuery !== null
      ? onlineUsers.filter((u) => u.toLowerCase().startsWith(mentionQuery.toLowerCase()) && u !== currentUser).slice(0, 5)
      : [];

    function detectMention(text: string, cursorPos: number) {
      // Look backwards from cursor for an @ that starts a mention
      const beforeCursor = text.slice(0, cursorPos);
      const atMatch = beforeCursor.match(/(^|[\s])@([^\s]*)$/);
      if (atMatch) {
        setMentionQuery(atMatch[2]);
        setMentionIndex(0);
      } else {
        setMentionQuery(null);
      }
    }

    function insertMention(username: string) {
      const el = textareaRef.current;
      if (!el) return;
      const cursorPos = el.selectionStart;
      const beforeCursor = value.slice(0, cursorPos);
      const afterCursor = value.slice(cursorPos);
      // Replace the @query with @username
      const atIdx = beforeCursor.lastIndexOf("@");
      const newValue = beforeCursor.slice(0, atIdx) + `@${username} ` + afterCursor;
      setValue(newValue);
      setMentionQuery(null);
      onTyping?.(newValue);
      // Set cursor after the inserted mention
      setTimeout(() => {
        const pos = atIdx + username.length + 2; // @username + space
        el.setSelectionRange(pos, pos);
        el.focus();
      }, 0);
    }

    return (
      <div className="relative border-t border-gray-800 bg-gray-900/90 backdrop-blur-md p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Mention autocomplete */}
        {mentionQuery !== null && mentionMatches.length > 0 && (
          <div ref={mentionRef} className="absolute bottom-full left-4 mb-2 z-40 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden w-56">
            {mentionMatches.map((user, i) => (
              <button
                key={user}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertMention(user); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  i === mentionIndex ? "bg-gray-700" : "hover:bg-gray-700/50"
                }`}
              >
                <span className={`font-medium ${getUserColor(user)}`}>@{user}</span>
              </button>
            ))}
          </div>
        )}

        {/* Emoji picker */}
        {showEmojis && (
          <div ref={pickerRef} className="absolute bottom-full left-4 mb-2 z-40 emoji-picker-container">
            <EmojiPicker
              theme={Theme.DARK}
              onEmojiClick={handleEmojiClick}
              width={320}
              height={400}
              searchPlaceholder="Search emojis..."
              lazyLoadEmojis
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          {/* Emoji toggle */}
          <button
            type="button"
            onClick={() => setShowEmojis((prev) => !prev)}
            disabled={disabled}
            aria-label={showEmojis ? "Close emoji picker" : "Open emoji picker"}
            className={`rounded-xl px-3 py-3 transition-colors focus:outline-none focus-visible:ring-2 ${theme?.inputFocusRing || "focus-visible:ring-emerald-500/50"} disabled:opacity-40 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center ${
              showEmojis
                ? `${theme?.sendButtonBg || "bg-emerald-600"}/20 ${theme?.activeToggle || "text-emerald-400"}`
                : "bg-gray-800 border border-gray-700 text-gray-500 hover:text-gray-300"
            }`}
          >
            <Smile className="h-5 w-5" />
          </button>

          {/* Textarea (multiline) */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              onTyping?.(e.target.value);
              detectMention(e.target.value, e.target.selectionStart);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type into the void..."
            maxLength={500}
            autoComplete="off"
            autoCorrect="off"
            rows={1}
            disabled={disabled}
            className={`flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-base text-gray-100 placeholder-gray-600 focus:outline-none ${theme?.inputFocusBorder || "focus:border-emerald-500"} focus-visible:ring-1 ${theme?.inputFocusRing || "focus-visible:ring-emerald-500/50"} transition-colors disabled:opacity-50 resize-none scrollbar-hide`}
            style={{ minHeight: "44px" }}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            aria-label="Send message"
            className={`${theme?.sendButtonBg || "bg-emerald-600"} ${theme?.sendButtonHover || "hover:bg-emerald-500"} disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-colors focus:outline-none focus-visible:ring-2 ${theme?.inputFocusRing || "focus-visible:ring-emerald-500/50"} shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center`}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    );
  }
);

export default MessageInput;
