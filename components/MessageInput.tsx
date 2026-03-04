"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Send, Smile } from "lucide-react";
import type { EmojiClickData } from "emoji-picker-react";
import { Theme } from "emoji-picker-react";

// Lazy-load the heavy emoji picker (~200-400KB) — only downloaded on first open
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
}

export default function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
  const [value, setValue] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojis(false);
      }
    }
    if (showEmojis) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojis]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    setShowEmojis(false);
    inputRef.current?.focus();
  }

  function handleEmojiClick(emojiData: EmojiClickData) {
    setValue((prev) => prev + emojiData.emoji);
    onTyping?.(value + emojiData.emoji);
    inputRef.current?.focus();
  }

  return (
    <div className="relative border-t border-gray-800 bg-gray-900/90 backdrop-blur-md p-4">
      {/* Emoji picker popover — lazy loaded */}
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

      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* Emoji toggle */}
        <button
          type="button"
          onClick={() => setShowEmojis((prev) => !prev)}
          disabled={disabled}
          aria-label={showEmojis ? "Close emoji picker" : "Open emoji picker"}
          className={`rounded-xl px-3 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-40 ${
            showEmojis
              ? "bg-emerald-600/20 text-emerald-400"
              : "bg-gray-800 border border-gray-700 text-gray-500 hover:text-gray-300"
          }`}
        >
          <Smile className="h-4 w-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onTyping?.(e.target.value);
          }}
          placeholder="Type into the void..."
          maxLength={500}
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="send"
          disabled={disabled}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
