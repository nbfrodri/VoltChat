"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { PublicRoom, RoomTag } from "@/lib/types";

interface LobbyPresence {
  roomId: string;
  creator: string;
  userCount: number;
  createdAt: string;
  maxUsers?: number;
  tags?: RoomTag[];
  encrypted?: boolean;
  ttl?: number;
  users?: string[];
  roomCreatedAt?: number;
  roomName?: string;
}

export function useLobby() {
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase.channel("lobby", {
      config: { presence: { key: "lobby" } },
    });

    function processState() {
      const state = channel.presenceState<LobbyPresence>();
      const roomMap = new Map<string, PublicRoom>();
      for (const [, entries] of Object.entries(state)) {
        const arr = entries as LobbyPresence[];
        if (!arr.length) continue;
        const p = arr[arr.length - 1];
        if (!p.roomId) continue;
        roomMap.set(p.roomId, {
          roomId: p.roomId,
          creator: p.creator,
          userCount: p.userCount,
          createdAt: p.createdAt,
          maxUsers: p.maxUsers,
          tags: p.tags,
          encrypted: p.encrypted,
          ttl: p.ttl,
          users: p.users,
          roomCreatedAt: p.roomCreatedAt,
          roomName: p.roomName,
        });
      }
      setPublicRooms(Array.from(roomMap.values()));
      setIsLoading(false);
    }

    channel
      .on("presence", { event: "sync" }, processState)
      .on("presence", { event: "join" }, processState)
      .on("presence", { event: "leave" }, processState)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsLoading(false);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { publicRooms, isLoading };
}
