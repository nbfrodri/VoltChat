import type { TypingUser } from "@/lib/types";

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  let label: string;
  if (typingUsers.length === 1) {
    label = `${typingUsers[0].user} is typing`;
  } else if (typingUsers.length === 2) {
    label = `${typingUsers[0].user} and ${typingUsers[1].user} are typing`;
  } else {
    label = `${typingUsers[0].user} and ${typingUsers.length - 1} others are typing`;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="px-4 py-2 border-t border-gray-800/50"
    >
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span>{label}</span>
        <span className="flex gap-0.5">
          <span className="w-1 h-1 rounded-full bg-gray-500 animate-bounce [animation-delay:0ms]" />
          <span className="w-1 h-1 rounded-full bg-gray-500 animate-bounce [animation-delay:150ms]" />
          <span className="w-1 h-1 rounded-full bg-gray-500 animate-bounce [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}
