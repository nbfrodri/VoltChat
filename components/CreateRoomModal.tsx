"use client";

import { useState } from "react";
import { Globe, Lock, Plus, X, Users, Tags, ShieldCheck, Timer } from "lucide-react";
import type { RoomVisibility, RoomTag } from "@/lib/types";
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

const TTL_OPTIONS = [
  { label: "None", value: 0 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "6 hours", value: 360 },
  { label: "24 hours", value: 1440 },
];

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (visibility: RoomVisibility, maxUsers?: number, tags?: RoomTag[], encrypted?: boolean, ttl?: number) => void;
}

export default function CreateRoomModal({ onClose, onCreate }: CreateRoomModalProps) {
  const [visibility, setVisibility] = useState<RoomVisibility>("private");
  const [hasCapacity, setHasCapacity] = useState(false);
  const [maxUsers, setMaxUsers] = useState(10);
  const [encrypted, setEncrypted] = useState(false);
  const [ttl, setTtl] = useState(0);

  // Tag creation
  const [tags, setTags] = useState<RoomTag[]>([]);
  const [showTagForm, setShowTagForm] = useState(false);
  const [tagLabel, setTagLabel] = useState("");
  const [tagColor, setTagColor] = useState(TAG_COLORS[0].hex);
  const [tagEmoji, setTagEmoji] = useState<string | undefined>(undefined);
  const [showEmojiGrid, setShowEmojiGrid] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  function addTag() {
    const trimmed = tagLabel.trim();
    if (!trimmed) { setTagError("Label is required"); return; }
    if (trimmed.length > 20) { setTagError("Max 20 characters"); return; }
    if (tags.some((t) => t.label.toLowerCase() === trimmed.toLowerCase())) { setTagError("Tag already exists"); return; }
    if (tags.length >= 5) { setTagError("Max 5 tags"); return; }

    setTags([...tags, {
      id: crypto.randomUUID(),
      label: trimmed,
      color: tagColor,
      ...(tagEmoji ? { emoji: tagEmoji } : {}),
    }]);
    setTagLabel("");
    setTagEmoji(undefined);
    setTagError(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 max-h-[90dvh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-gray-100">Create Room</h2>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Visibility toggle */}
        <p className="text-sm text-gray-500 uppercase tracking-wider mb-3">Room visibility</p>
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => { setVisibility("private"); setTags([]); setShowTagForm(false); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-base font-medium transition-all border ${
              visibility === "private"
                ? "bg-gray-800 border-emerald-600/50 text-emerald-400 shadow-glow-green"
                : "bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300"
            }`}
          >
            <Lock className="h-5 w-5" />
            Private
          </button>
          <button
            onClick={() => { setVisibility("public"); setEncrypted(false); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-base font-medium transition-all border ${
              visibility === "public"
                ? "bg-gray-800 border-emerald-600/50 text-emerald-400 shadow-glow-green"
                : "bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300"
            }`}
          >
            <Globe className="h-5 w-5" />
            Public
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          {visibility === "private"
            ? "Only people with the link can join this room."
            : "This room will be listed on the main page for anyone to join."}
        </p>

        {/* Encryption toggle — private rooms only */}
        {visibility === "private" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-500 uppercase tracking-wider">Encryption</p>
              </div>
              <button
                onClick={() => setEncrypted(!encrypted)}
                className={`relative w-9 h-5 rounded-full transition-colors ${encrypted ? "bg-emerald-600" : "bg-gray-700"}`}
                aria-label="Toggle encryption"
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${encrypted ? "translate-x-4" : ""}`} />
              </button>
            </div>
            <p className="text-xs text-gray-600">
              {encrypted
                ? "Messages will be end-to-end encrypted. Only users with the full link can read them."
                : "Messages are relayed through servers without encryption."}
            </p>
          </div>
        )}

        {/* TTL selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-gray-500" />
            <p className="text-sm text-gray-500 uppercase tracking-wider">Room duration</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TTL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTtl(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  ttl === opt.value
                    ? "bg-emerald-900/30 border-emerald-600/50 text-emerald-400"
                    : "bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {ttl > 0 && (
            <p className="text-xs text-gray-600 mt-2">Room will auto-close after {TTL_OPTIONS.find((o) => o.value === ttl)?.label}.</p>
          )}
        </div>

        {/* Capacity toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500 uppercase tracking-wider">User limit</p>
            <button
              onClick={() => setHasCapacity(!hasCapacity)}
              className={`relative w-9 h-5 rounded-full transition-colors ${hasCapacity ? "bg-emerald-600" : "bg-gray-700"}`}
              aria-label="Toggle user limit"
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${hasCapacity ? "translate-x-4" : ""}`} />
            </button>
          </div>
          {hasCapacity && (
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-500 shrink-0" />
              <input type="range" min={2} max={50} value={maxUsers} onChange={(e) => setMaxUsers(Number(e.target.value))} className="flex-1 accent-emerald-500" />
              <span className="text-base text-gray-300 w-8 text-right tabular-nums">{maxUsers}</span>
            </div>
          )}
        </div>

        {/* Tags — public rooms only */}
        {visibility === "public" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Tags className="h-3.5 w-3.5 text-gray-500" />
              <p className="text-xs text-gray-500 uppercase tracking-wider">Tags</p>
              <span className="text-[10px] text-gray-600">{tags.length}/5</span>
            </div>
            {!showTagForm && tags.length < 5 && (
              <button onClick={() => setShowTagForm(true)} className="text-xs text-emerald-400 hover:text-emerald-300">
                + Add
              </button>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} onRemove={() => setTags(tags.filter((t) => t.id !== tag.id))} />
              ))}
            </div>
          )}

          {showTagForm && tags.length < 5 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-2.5">
              <input
                type="text"
                value={tagLabel}
                onChange={(e) => { setTagLabel(e.target.value); if (tagError) setTagError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Tag label..."
                maxLength={20}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">Color</span>
                <div className="flex gap-1">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setTagColor(c.hex)}
                      className={`w-5 h-5 rounded-full transition-all ${tagColor === c.hex ? "ring-2 ring-white ring-offset-1 ring-offset-gray-800 scale-110" : "hover:scale-110"}`}
                      style={{ backgroundColor: c.hex }}
                      aria-label={c.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">Emoji</span>
                <button
                  onClick={() => setShowEmojiGrid(!showEmojiGrid)}
                  className={`px-2 py-0.5 rounded text-sm border transition-colors ${tagEmoji ? "bg-gray-700 border-gray-600" : "bg-gray-900 border-gray-700 text-gray-500"}`}
                >
                  {tagEmoji || "None"}
                </button>
                {tagEmoji && (
                  <button onClick={() => setTagEmoji(undefined)} className="text-[10px] text-gray-600 hover:text-gray-400">Clear</button>
                )}
              </div>
              {showEmojiGrid && (
                <div className="grid grid-cols-6 gap-1 p-2 bg-gray-900 rounded-lg border border-gray-700">
                  {COMMON_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => { setTagEmoji(e); setShowEmojiGrid(false); }}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 text-sm transition-colors"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
              {tagError && <p className="text-red-400 text-[10px]">{tagError}</p>}
              <div className="flex gap-2">
                <button onClick={addTag} disabled={!tagLabel.trim()} className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 rounded-lg px-3 py-1.5 text-xs transition-colors">
                  Add
                </button>
                <button onClick={() => { setShowTagForm(false); setTagLabel(""); setTagError(null); }} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Create button */}
        <button
          onClick={() => onCreate(
            visibility,
            hasCapacity ? maxUsers : undefined,
            tags.length > 0 ? tags : undefined,
            encrypted || undefined,
            ttl || undefined,
          )}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-3.5 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <Plus className="h-5 w-5" />
          Create Room
        </button>
      </div>
    </div>
  );
}
