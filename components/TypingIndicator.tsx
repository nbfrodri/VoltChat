import type { TypingUser } from "@/lib/types";
import type { ChatTheme } from "@/lib/themes";
import { getUserColor } from "@/lib/utils";

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  theme?: ChatTheme;
}

export default function TypingIndicator({ typingUsers, theme }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const dotColor = theme?.typingDot || "bg-gray-500";

  function renderLabel() {
    if (typingUsers.length === 1) {
      return (
        <>
          <span className={getUserColor(typingUsers[0].user)}>{typingUsers[0].user}</span>
          {" is typing"}
        </>
      );
    } else if (typingUsers.length === 2) {
      return (
        <>
          <span className={getUserColor(typingUsers[0].user)}>{typingUsers[0].user}</span>
          {" and "}
          <span className={getUserColor(typingUsers[1].user)}>{typingUsers[1].user}</span>
          {" are typing"}
        </>
      );
    } else {
      return (
        <>
          <span className={getUserColor(typingUsers[0].user)}>{typingUsers[0].user}</span>
          {` and ${typingUsers.length - 1} others are typing`}
        </>
      );
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="px-4 py-2 border-t border-gray-800/50"
    >
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span>{renderLabel()}</span>
        <span className="flex gap-0.5">
          <span className={`w-1 h-1 rounded-full ${dotColor} animate-bounce [animation-delay:0ms]`} />
          <span className={`w-1 h-1 rounded-full ${dotColor} animate-bounce [animation-delay:150ms]`} />
          <span className={`w-1 h-1 rounded-full ${dotColor} animate-bounce [animation-delay:300ms]`} />
        </span>
      </div>
    </div>
  );
}
