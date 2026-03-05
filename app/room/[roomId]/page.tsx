"use client";

import { use, useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import JoinModal from "@/components/JoinModal";
import ChatInterface from "@/components/ChatInterface";
import { isValidRoomId, parseVisibility, parseMaxUsers } from "@/lib/utils";
import { getKeyFromHash } from "@/lib/crypto";
import type { RoomTag } from "@/lib/types";

function parseTags(raw: string | null): RoomTag[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    return parsed.filter(
      (t: unknown) =>
        typeof t === "object" && t !== null &&
        typeof (t as RoomTag).id === "string" &&
        typeof (t as RoomTag).label === "string" &&
        typeof (t as RoomTag).color === "string"
    ).slice(0, 5) as RoomTag[];
  } catch {
    return undefined;
  }
}

function parseTtl(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const num = parseInt(raw, 10);
  if (isNaN(num) || num <= 0) return undefined;
  return num;
}

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
  const initialTags = useMemo(() => parseTags(searchParams.get("tags")), [searchParams]);
  const initialTtl = useMemo(() => parseTtl(searchParams.get("ttl")), [searchParams]);
  const initialRoomName = useMemo(() => {
    const raw = searchParams.get("name");
    return raw ? raw.slice(0, 40) : undefined;
  }, [searchParams]);
  const isE2ee = searchParams.get("e2ee") === "1";
  const [username, setUsername] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);

  // Extract encryption key from URL hash on mount
  useEffect(() => {
    if (isE2ee) {
      const key = getKeyFromHash();
      setEncryptionKey(key);
    }
  }, [isE2ee]);

  if (!isValidRoomId(roomId)) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-100 mb-2">Invalid room ID</h2>
          <p className="text-sm text-gray-500 mb-6">Room IDs can only contain letters and numbers.</p>
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
      initialTags={initialTags}
      encryptionKey={encryptionKey}
      initialTtl={initialTtl}
      initialRoomName={initialRoomName}
    />
  );
}
