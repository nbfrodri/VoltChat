"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import JoinModal from "@/components/JoinModal";
import ChatInterface from "@/components/ChatInterface";
import type { RoomVisibility } from "@/lib/types";

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const searchParams = useSearchParams();
  const visibility = (searchParams.get("v") || "private") as RoomVisibility;
  const [username, setUsername] = useState<string | null>(null);

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
    />
  );
}
