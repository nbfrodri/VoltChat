"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { PublicRoom } from "@/lib/types";

interface LobbyPresence {
  roomId: string;
  creator: string;
  userCount: number;
  createdAt: string;
  maxUsers?: number;
}

export function useLobby() {
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase.channel("lobby", {
      config: { presence: { key: "lobby" } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<LobbyPresence>();
        const rooms: PublicRoom[] = Object.values(state)
          .flat()
          .map((p) => ({
            roomId: p.roomId,
            creator: p.creator,
            userCount: p.userCount,
            createdAt: p.createdAt,
            maxUsers: p.maxUsers,
          }));
        setPublicRooms(rooms);
        setIsLoading(false);
      })
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
