import { X } from "lucide-react";
import type { RoomTag } from "@/lib/types";

interface TagBadgeProps {
  tag: RoomTag;
  size?: "sm" | "md";
  onRemove?: () => void;
}

export default function TagBadge({ tag, size = "md", onRemove }: TagBadgeProps) {
  const isSm = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium shrink-0 ${
        isSm ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
      style={{
        backgroundColor: `${tag.color}20`,
        borderColor: `${tag.color}66`,
        color: tag.color,
      }}
      aria-label={`Tag: ${tag.label}`}
    >
      {tag.emoji && <span>{tag.emoji}</span>}
      <span className="truncate max-w-[100px]">{tag.label}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70 transition-opacity"
          aria-label={`Remove tag ${tag.label}`}
        >
          <X className={isSm ? "h-2.5 w-2.5" : "h-3 w-3"} />
        </button>
      )}
    </span>
  );
}
