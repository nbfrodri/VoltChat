export interface ChatTheme {
  id: string;
  name: string;
  accent: string;       // Tailwind color name (e.g., "emerald")
  accentHex: string;    // Hex for inline styles

  // Self message bubble
  selfBubbleBg: string;
  selfBubbleBorder: string;
  selfBubbleText: string;
  selfAvatarBg: string;
  selfAvatarText: string;

  // Header & UI accents
  connectionBar: string;        // Connection status bar color
  headerAccent: string;         // Room ID text, Globe icon, etc.
  headerIcon: string;           // E2EE shield, encryption icon

  // Input area
  sendButtonBg: string;         // Send button background
  sendButtonHover: string;      // Send button hover
  inputFocusBorder: string;     // Input focus border color
  inputFocusRing: string;       // Input focus ring

  // Reactions & interactions
  selfReactionBg: string;       // Self-reacted reaction bg
  selfReactionBorder: string;   // Self-reacted reaction border
  selfReactionText: string;     // Self-reacted reaction text

  // Reply
  replyBorder: string;          // Reply preview left border (self)
  replyBg: string;              // Reply preview bg (self)
  replyAccentText: string;      // "Replying to X" accent text

  // Typing indicator
  typingDot: string;            // Typing dots color

  // Scroll button
  scrollButtonHover: string;    // Scroll-to-bottom hover text

  // E2EE banner
  e2eeBannerBg: string;
  e2eeBannerBorder: string;
  e2eeBannerText: string;

  // Active filter / toggles
  activeToggle: string;         // Active icon accent (content filter, etc.)
  toggleBg: string;             // Toggle switch ON bg
}

export const THEMES: ChatTheme[] = [
  {
    id: "emerald",
    name: "Emerald",
    accent: "emerald",
    accentHex: "#10b981",
    selfBubbleBg: "bg-emerald-900/60",
    selfBubbleBorder: "border-emerald-700/30",
    selfBubbleText: "text-emerald-100",
    selfAvatarBg: "bg-emerald-900",
    selfAvatarText: "text-emerald-300",
    connectionBar: "bg-emerald-500/50",
    headerAccent: "text-emerald-400",
    headerIcon: "text-emerald-400",
    sendButtonBg: "bg-emerald-600",
    sendButtonHover: "hover:bg-emerald-500",
    inputFocusBorder: "focus:border-emerald-500",
    inputFocusRing: "focus-visible:ring-emerald-500/50",
    selfReactionBg: "bg-emerald-900/30",
    selfReactionBorder: "border-emerald-700/50",
    selfReactionText: "text-emerald-300",
    replyBorder: "border-emerald-600",
    replyBg: "bg-emerald-900/20",
    replyAccentText: "text-emerald-400",
    typingDot: "bg-emerald-500",
    scrollButtonHover: "hover:text-emerald-400",
    e2eeBannerBg: "bg-emerald-900/20",
    e2eeBannerBorder: "border-emerald-800/30",
    e2eeBannerText: "text-emerald-400/80",
    activeToggle: "text-emerald-400",
    toggleBg: "bg-emerald-600",
  },
  {
    id: "blue",
    name: "Ocean",
    accent: "blue",
    accentHex: "#3b82f6",
    selfBubbleBg: "bg-blue-900/60",
    selfBubbleBorder: "border-blue-700/30",
    selfBubbleText: "text-blue-100",
    selfAvatarBg: "bg-blue-900",
    selfAvatarText: "text-blue-300",
    connectionBar: "bg-blue-500/50",
    headerAccent: "text-blue-400",
    headerIcon: "text-blue-400",
    sendButtonBg: "bg-blue-600",
    sendButtonHover: "hover:bg-blue-500",
    inputFocusBorder: "focus:border-blue-500",
    inputFocusRing: "focus-visible:ring-blue-500/50",
    selfReactionBg: "bg-blue-900/30",
    selfReactionBorder: "border-blue-700/50",
    selfReactionText: "text-blue-300",
    replyBorder: "border-blue-600",
    replyBg: "bg-blue-900/20",
    replyAccentText: "text-blue-400",
    typingDot: "bg-blue-500",
    scrollButtonHover: "hover:text-blue-400",
    e2eeBannerBg: "bg-blue-900/20",
    e2eeBannerBorder: "border-blue-800/30",
    e2eeBannerText: "text-blue-400/80",
    activeToggle: "text-blue-400",
    toggleBg: "bg-blue-600",
  },
  {
    id: "purple",
    name: "Violet",
    accent: "purple",
    accentHex: "#a855f7",
    selfBubbleBg: "bg-purple-900/60",
    selfBubbleBorder: "border-purple-700/30",
    selfBubbleText: "text-purple-100",
    selfAvatarBg: "bg-purple-900",
    selfAvatarText: "text-purple-300",
    connectionBar: "bg-purple-500/50",
    headerAccent: "text-purple-400",
    headerIcon: "text-purple-400",
    sendButtonBg: "bg-purple-600",
    sendButtonHover: "hover:bg-purple-500",
    inputFocusBorder: "focus:border-purple-500",
    inputFocusRing: "focus-visible:ring-purple-500/50",
    selfReactionBg: "bg-purple-900/30",
    selfReactionBorder: "border-purple-700/50",
    selfReactionText: "text-purple-300",
    replyBorder: "border-purple-600",
    replyBg: "bg-purple-900/20",
    replyAccentText: "text-purple-400",
    typingDot: "bg-purple-500",
    scrollButtonHover: "hover:text-purple-400",
    e2eeBannerBg: "bg-purple-900/20",
    e2eeBannerBorder: "border-purple-800/30",
    e2eeBannerText: "text-purple-400/80",
    activeToggle: "text-purple-400",
    toggleBg: "bg-purple-600",
  },
  {
    id: "rose",
    name: "Rose",
    accent: "rose",
    accentHex: "#f43f5e",
    selfBubbleBg: "bg-rose-900/60",
    selfBubbleBorder: "border-rose-700/30",
    selfBubbleText: "text-rose-100",
    selfAvatarBg: "bg-rose-900",
    selfAvatarText: "text-rose-300",
    connectionBar: "bg-rose-500/50",
    headerAccent: "text-rose-400",
    headerIcon: "text-rose-400",
    sendButtonBg: "bg-rose-600",
    sendButtonHover: "hover:bg-rose-500",
    inputFocusBorder: "focus:border-rose-500",
    inputFocusRing: "focus-visible:ring-rose-500/50",
    selfReactionBg: "bg-rose-900/30",
    selfReactionBorder: "border-rose-700/50",
    selfReactionText: "text-rose-300",
    replyBorder: "border-rose-600",
    replyBg: "bg-rose-900/20",
    replyAccentText: "text-rose-400",
    typingDot: "bg-rose-500",
    scrollButtonHover: "hover:text-rose-400",
    e2eeBannerBg: "bg-rose-900/20",
    e2eeBannerBorder: "border-rose-800/30",
    e2eeBannerText: "text-rose-400/80",
    activeToggle: "text-rose-400",
    toggleBg: "bg-rose-600",
  },
  {
    id: "amber",
    name: "Amber",
    accent: "amber",
    accentHex: "#f59e0b",
    selfBubbleBg: "bg-amber-900/60",
    selfBubbleBorder: "border-amber-700/30",
    selfBubbleText: "text-amber-100",
    selfAvatarBg: "bg-amber-900",
    selfAvatarText: "text-amber-300",
    connectionBar: "bg-amber-500/50",
    headerAccent: "text-amber-400",
    headerIcon: "text-amber-400",
    sendButtonBg: "bg-amber-600",
    sendButtonHover: "hover:bg-amber-500",
    inputFocusBorder: "focus:border-amber-500",
    inputFocusRing: "focus-visible:ring-amber-500/50",
    selfReactionBg: "bg-amber-900/30",
    selfReactionBorder: "border-amber-700/50",
    selfReactionText: "text-amber-300",
    replyBorder: "border-amber-600",
    replyBg: "bg-amber-900/20",
    replyAccentText: "text-amber-400",
    typingDot: "bg-amber-500",
    scrollButtonHover: "hover:text-amber-400",
    e2eeBannerBg: "bg-amber-900/20",
    e2eeBannerBorder: "border-amber-800/30",
    e2eeBannerText: "text-amber-400/80",
    activeToggle: "text-amber-400",
    toggleBg: "bg-amber-600",
  },
  {
    id: "cyan",
    name: "Cyan",
    accent: "cyan",
    accentHex: "#06b6d4",
    selfBubbleBg: "bg-cyan-900/60",
    selfBubbleBorder: "border-cyan-700/30",
    selfBubbleText: "text-cyan-100",
    selfAvatarBg: "bg-cyan-900",
    selfAvatarText: "text-cyan-300",
    connectionBar: "bg-cyan-500/50",
    headerAccent: "text-cyan-400",
    headerIcon: "text-cyan-400",
    sendButtonBg: "bg-cyan-600",
    sendButtonHover: "hover:bg-cyan-500",
    inputFocusBorder: "focus:border-cyan-500",
    inputFocusRing: "focus-visible:ring-cyan-500/50",
    selfReactionBg: "bg-cyan-900/30",
    selfReactionBorder: "border-cyan-700/50",
    selfReactionText: "text-cyan-300",
    replyBorder: "border-cyan-600",
    replyBg: "bg-cyan-900/20",
    replyAccentText: "text-cyan-400",
    typingDot: "bg-cyan-500",
    scrollButtonHover: "hover:text-cyan-400",
    e2eeBannerBg: "bg-cyan-900/20",
    e2eeBannerBorder: "border-cyan-800/30",
    e2eeBannerText: "text-cyan-400/80",
    activeToggle: "text-cyan-400",
    toggleBg: "bg-cyan-600",
  },
];

const STORAGE_PREFIX = "voltchat-theme-";

export function getThemeForRoom(roomId: string): ChatTheme {
  if (typeof window === "undefined") return THEMES[0];
  const saved = localStorage.getItem(`${STORAGE_PREFIX}${roomId}`);
  if (saved) {
    const found = THEMES.find((t) => t.id === saved);
    if (found) return found;
  }
  return THEMES[0];
}

export function setThemeForRoom(roomId: string, themeId: string) {
  localStorage.setItem(`${STORAGE_PREFIX}${roomId}`, themeId);
}
