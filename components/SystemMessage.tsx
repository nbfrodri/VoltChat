import type { ChatMessage } from "@/lib/types";

interface SystemMessageProps {
  message: ChatMessage;
}

export default function SystemMessage({ message }: SystemMessageProps) {
  return (
    <div role="note" className="flex justify-center py-1 animate-slide-in">
      <span className="text-purple-400/70 italic text-xs">
        {message.text}
      </span>
    </div>
  );
}
