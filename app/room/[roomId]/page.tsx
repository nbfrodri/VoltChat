"use client";

import { use, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import JoinModal from "@/components/JoinModal";
import ChatInterface from "@/components/ChatInterface";
import { isValidRoomId, parseVisibility, parseMaxUsers } from "@/lib/utils";

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const visibility = parseVisibility(searchParams.get("v"));
  const maxUsers = parseMaxUsers(searchParams.get("max"));
  const [username, setUsername] = useState<string | null>(null);

  // Reject invalid room IDs
  if (!isValidRoomId(roomId)) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-100 mb-2">Invalid room ID</h2>
          <p className="text-sm text-gray-500 mb-6">
            Room IDs can only contain letters and numbers.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl px-6 py-3 text-sm font-medium transition-colors"
          >
            Back to lobby
          </button>
        </div>
      </div>
    );
  }

  if (!username) {
    return (
      <div className="h-dvh bg-gray-950">
        <JoinModal roomId={roomId} onJoin={(name) => setUsername(name)} />
      </div>
    );
  }

  return (
    <ChatInterface
      roomId={roomId}
      username={username}
      visibility={visibility}
      initialMaxUsers={maxUsers}
    />
  );
}
