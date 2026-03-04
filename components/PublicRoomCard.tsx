import { Hash, Users, Crown } from "lucide-react";
import type { PublicRoom } from "@/lib/types";

interface PublicRoomCardProps {
  room: PublicRoom;
  onClick: () => void;
}

export default function PublicRoomCard({ room, onClick }: PublicRoomCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-emerald-700/30 rounded-xl p-4 transition-all hover:shadow-glow-green group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-sm font-medium text-gray-100 group-hover:text-emerald-300 transition-colors">
            {room.roomId}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Users className="h-3 w-3" />
          <span>
            {room.userCount}
            {room.maxUsers ? `/${room.maxUsers}` : ""}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Crown className="h-3 w-3 text-yellow-500/70" />
        <span>{room.creator}</span>
      </div>
    </button>
  );
}
