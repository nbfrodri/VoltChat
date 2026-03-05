"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { RoomTag } from "@/lib/types";
import TagBadge from "@/components/TagBadge";

const TAG_COLORS = [
  { name: "emerald", hex: "#10b981" },
  { name: "purple", hex: "#a855f7" },
  { name: "blue", hex: "#3b82f6" },
  { name: "amber", hex: "#f59e0b" },
  { name: "rose", hex: "#f43f5e" },
  { name: "cyan", hex: "#06b6d4" },
  { name: "orange", hex: "#f97316" },
  { name: "pink", hex: "#ec4899" },
];

const COMMON_EMOJIS = ["💬", "🎮", "🎵", "💻", "📚", "🎨", "⚡", "🔥", "👻", "🌙", "🤖", "🎯"];

interface TagManagerProps {
  tags: RoomTag[];
  onTagsChange: (tags: RoomTag[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function TagManager({ tags, onTagsChange, isOpen, onClose }: TagManagerProps) {
  const [label, setLabel] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0].hex);
  const [selectedEmoji, setSelectedEmoji] = useState<string | undefined>(undefined);
  const [showEmojiGrid, setShowEmojiGrid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleAdd() {
    const trimmed = label.trim();
    if (!trimmed) {
      setError("Label is required");
      return;
    }
    if (trimmed.length > 20) {
      setError("Max 20 characters");
      return;
    }
    if (tags.some((t) => t.label.toLowerCase() === trimmed.toLowerCase())) {
      setError("Tag already exists");
      return;
    }
    if (tags.length >= 5) {
      setError("Max 5 tags");
      return;
    }

    const newTag: RoomTag = {
      id: crypto.randomUUID(),
      label: trimmed,
      color: selectedColor,
      ...(selectedEmoji ? { emoji: selectedEmoji } : {}),
    };
    onTagsChange([...tags, newTag]);
    setLabel("");
    setSelectedEmoji(undefined);
    setError(null);
  }

  function handleRemove(id: string) {
    onTagsChange(tags.filter((t) => t.id !== id));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-200">Manage Tags</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{tags.length}/5</span>
            <button
              onClick={onClose}
              className="p-0.5 text-gray-500 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Existing tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} onRemove={() => handleRemove(tag.id)} />
            ))}
          </div>
        )}

        {/* Add tag form */}
        {tags.length < 5 && (
          <div className="space-y-3">
            {/* Label input */}
            <input
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="Tag label..."
              maxLength={20}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
            />

            {/* Color selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 shrink-0">Color</span>
              <div className="flex gap-1.5">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.hex)}
                    className={`w-6 h-6 rounded-full transition-all ${
                      selectedColor === c.hex
                        ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Emoji selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 shrink-0">Emoji</span>
              <button
                onClick={() => setShowEmojiGrid(!showEmojiGrid)}
                className={`px-2 py-1 rounded-lg text-sm border transition-colors ${
                  selectedEmoji
                    ? "bg-gray-700 border-gray-600"
                    : "bg-gray-900 border-gray-700 text-gray-500"
                }`}
              >
                {selectedEmoji || "None"}
              </button>
              {selectedEmoji && (
                <button
                  onClick={() => setSelectedEmoji(undefined)}
                  className="text-xs text-gray-600 hover:text-gray-400"
                >
                  Clear
                </button>
              )}
            </div>
            {showEmojiGrid && (
              <div className="grid grid-cols-6 gap-1.5 p-2 bg-gray-900 rounded-lg border border-gray-700">
                {COMMON_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      setSelectedEmoji(e);
                      setShowEmojiGrid(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 text-base transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            {error && <p className="text-red-400 text-xs">{error}</p>}

            {/* Add button */}
            <button
              onClick={handleAdd}
              disabled={!label.trim()}
              className="w-full flex items-center justify-center gap-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 rounded-lg px-3 py-2 text-sm transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Tag
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
