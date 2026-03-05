import { X } from "lucide-react";

interface HelpSection {
  title: string;
  items: { action: string; how: string }[];
}

const HELP_SECTIONS: HelpSection[] = [
  {
    title: "Messaging",
    items: [
      { action: "Send a message", how: "Type and press Enter" },
      { action: "New line", how: "Shift + Enter" },
      { action: "Reply to a message", how: "Double-click a message → Reply, or swipe right on mobile" },
      { action: "Copy a message", how: "Double-click a message → Copy" },
      { action: "Read receipts", how: "User avatars appear below messages when read" },
      { action: "Message density", how: "Toggle compact/comfortable via the density icon in the header" },
    ],
  },
  {
    title: "Mentions & Reactions",
    items: [
      { action: "Mention a user", how: "Type @ followed by their name" },
      { action: "Pick from suggestions", how: "Arrow keys to navigate, Tab or Enter to select" },
      { action: "React to a message", how: "Double-click a message → React, then pick an emoji" },
      { action: "Remove your reaction", how: "Click the reaction badge again" },
    ],
  },
  {
    title: "Room Management",
    items: [
      { action: "Kick a user (creator)", how: "Click the user in the sidebar → Kick" },
      { action: "Vote kick (non-creator)", how: "Click the user in the sidebar → Vote Kick" },
      { action: "Mute / unmute (creator)", how: "Click the user in the sidebar → Mute" },
      { action: "Silence a user (local)", how: "Click the user in the sidebar → Silence (hides their messages for you only)" },
      { action: "Nuke the room (creator)", how: "Click the skull icon in the header" },
      { action: "Room settings (creator)", how: "Click the gear icon in the header to manage room options" },
      { action: "Manage tags (creator)", how: "Add or remove topic tags from room settings" },
      { action: "Report a user", how: "Double-click a message → Report" },
    ],
  },
  {
    title: "Sharing & Security",
    items: [
      { action: "Share room link", how: "Click the share icon in the header to copy the invite link" },
      { action: "Encrypted rooms (E2EE)", how: "Enable encryption when creating a room — messages are end-to-end encrypted" },
      { action: "Room duration (TTL)", how: "Set a time limit when creating a room — it auto-closes when time expires" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { action: "Toggle sidebar", how: "Click the users icon or Ctrl+Shift+S" },
      { action: "Copy room ID", how: "Click the room ID or Ctrl+Shift+C" },
      { action: "Focus input", how: "Ctrl + K" },
      { action: "Close panels", how: "Escape" },
      { action: "Show this guide", how: "Press ? or click the help button" },
    ],
  },
  {
    title: "Other",
    items: [
      { action: "Emoji picker", how: "Click the smiley face next to the input" },
      { action: "Zoom chat (desktop)", how: "Click the zoom icon in the header" },
      { action: "Change theme", how: "Click the palette icon in the header" },
      { action: "AFK detection", how: "Idle for 5 min → AFK status, 15 min → auto-kicked" },
      { action: "Spam protection", how: "5+ messages in 3 seconds triggers a cooldown" },
    ],
  },
];

interface ShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsOverlay({ isOpen, onClose }: ShortcutsOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Help guide"
    >
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-xl shadow-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <span className="text-sm font-medium text-gray-200">How to use VoltChat</span>
          <button
            onClick={onClose}
            className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5 space-y-4 scrollbar-hide">
          {HELP_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <div key={item.action} className="flex items-start gap-3 py-1">
                    <span className="text-xs text-gray-300 font-medium min-w-[120px] shrink-0">{item.action}</span>
                    <span className="text-xs text-gray-500">{item.how}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
