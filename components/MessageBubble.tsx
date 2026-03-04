import type { ChatMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  opacity?: number;
  isDisintegrating?: boolean;
  disintegrationDelay?: number;
}

export default function MessageBubble({
  message,
  isSelf,
  opacity = 1,
  isDisintegrating = false,
  disintegrationDelay = 0,
}: MessageBubbleProps) {
  const initial = message.user.charAt(0).toUpperCase();

  return (
    <div
      role="article"
      aria-label={`Message from ${message.user}: ${message.text}`}
      className={`flex items-end gap-2 max-w-[80%] ${
        isSelf ? "ml-auto flex-row-reverse" : ""
      } ${isSelf ? "animate-slide-in-right" : "animate-slide-in-left"} ${
        isDisintegrating ? "animate-disintegrate" : ""
      }`}
      style={{
        opacity: isDisintegrating ? undefined : opacity,
        transition: "opacity 2s ease-out",
        animationDelay: isDisintegrating ? `${disintegrationDelay}ms` : undefined,
      }}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
          isSelf
            ? "bg-emerald-900 text-emerald-300"
            : "bg-gray-700 text-gray-300"
        }`}
      >
        {initial}
      </div>

      {/* Bubble */}
      <div className={isSelf ? "flex flex-col items-end" : ""}>
        {!isSelf && (
          <span className="text-xs text-gray-500 ml-1 mb-1">
            {message.user}
          </span>
        )}
        <div
          className={`px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words ${
            isSelf
              ? "bg-emerald-900/60 border border-emerald-700/30 rounded-br-none text-emerald-100"
              : "bg-gray-800 border border-gray-700/50 rounded-bl-none text-gray-200"
          }`}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}
