"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ChatMessage, UserPresence, TypingUser, RoomVisibility } from "@/lib/types";

interface TypingEntry {
  text: string;
  lastSeen: number;
}

interface UseChatRoomOptions {
  roomId: string;
  username: string;
  visibility: RoomVisibility;
}

export function useChatRoom({ roomId, username, visibility }: UseChatRoomOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [typingMap, setTypingMap] = useState<Record<string, TypingEntry>>({});
  const [isNuking, setIsNuking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [creator, setCreator] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lobbyChannelRef = useRef<RealtimeChannel | null>(null);
  const nukeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sweepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const creatorResolvedRef = useRef(false);

  useEffect(() => {
    const channel = supabase.channel(`room_${roomId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: username },
      },
    });

    channel
      .on("broadcast", { event: "shout" }, ({ payload }) => {
        const msg = payload as ChatMessage;
        setMessages((prev) => [...prev, msg]);
        setTypingMap((prev) => {
          if (!prev[msg.user]) return prev;
          const next = { ...prev };
          delete next[msg.user];
          return next;
        });
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const { user, typing } = payload as { user: string; typing: boolean };
        if (user === username) return;
        setTypingMap((prev) => {
          if (!typing) {
            if (!prev[user]) return prev;
            const next = { ...prev };
            delete next[user];
            return next;
          }
          return { ...prev, [user]: { text: "", lastSeen: Date.now() } };
        });
      })
      .on("broadcast", { event: "nuke" }, () => {
        setIsNuking(true);
        nukeTimeoutRef.current = setTimeout(() => {
          window.location.href = "/";
        }, 2800);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<UserPresence>();
        const users = Object.values(state)
          .flat()
          .map((p) => ({
            user: p.user,
            online_at: p.online_at,
            isCreator: p.isCreator,
          }));
        setOnlineUsers(users);

        // Detect creator from presence
        const creatorUser = users.find((u) => u.isCreator);
        if (creatorUser) {
          setCreator(creatorUser.user);
        }

        // Update lobby user count if we're the creator of a public room
        if (visibility === "public" && lobbyChannelRef.current && creatorResolvedRef.current) {
          setIsCreator((current) => {
            if (current) {
              lobbyChannelRef.current?.track({
                roomId,
                creator: username,
                userCount: users.length,
                createdAt: new Date().toISOString(),
              });
            }
            return current;
          });
        }
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        for (const p of newPresences) {
          const joined = (p as unknown as UserPresence).user;
          if (joined === username) continue;
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              text: `${joined} joined the void`,
              user: "system",
              timestamp: Date.now(),
              type: "system",
            },
          ]);
        }
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        for (const p of leftPresences) {
          const left = (p as unknown as UserPresence).user;
          if (left === username) continue;
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              text: `${left} dissolved into nothing`,
              user: "system",
              timestamp: Date.now(),
              type: "system",
            },
          ]);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);

          // Check if we're the first user (creator)
          const currentState = channel.presenceState<UserPresence>();
          const existingUsers = Object.values(currentState).flat();
          const amCreator = existingUsers.length === 0;

          setIsCreator(amCreator);
          creatorResolvedRef.current = true;
          if (amCreator) {
            setCreator(username);
          }

          await channel.track({
            user: username,
            online_at: new Date().toISOString(),
            isCreator: amCreator,
          });

          // If public + creator, join lobby
          if (visibility === "public" && amCreator) {
            const lobbyChannel = supabase.channel("lobby", {
              config: { presence: { key: roomId } },
            });
            lobbyChannel.subscribe(async (lobbyStatus) => {
              if (lobbyStatus === "SUBSCRIBED") {
                await lobbyChannel.track({
                  roomId,
                  creator: username,
                  userCount: 1,
                  createdAt: new Date().toISOString(),
                });
              }
            });
            lobbyChannelRef.current = lobbyChannel;
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setIsConnected(false);
        } else if (status === "CLOSED") {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    // Sweep stale typing entries every 500ms
    sweepIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setTypingMap((prev) => {
        const next: Record<string, TypingEntry> = {};
        let changed = false;
        for (const [key, val] of Object.entries(prev)) {
          if (now - val.lastSeen < 2000) {
            next[key] = val;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 500);

    return () => {
      if (nukeTimeoutRef.current) clearTimeout(nukeTimeoutRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (sweepIntervalRef.current) clearInterval(sweepIntervalRef.current);
      if (lobbyChannelRef.current) supabase.removeChannel(lobbyChannelRef.current);
      supabase.removeChannel(channel);
    };
  }, [roomId, username, visibility]);

  const lastMessageSentRef = useRef(0);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !channelRef.current) return;

      // Rate limit: min 250ms between messages
      const now = Date.now();
      if (now - lastMessageSentRef.current < 250) return;
      lastMessageSentRef.current = now;

      channelRef.current.send({
        type: "broadcast",
        event: "shout",
        payload: {
          id: crypto.randomUUID(),
          text: trimmed,
          user: username,
          timestamp: Date.now(),
          type: "message",
        } satisfies ChatMessage,
      });
    },
    [username]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current) return;

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      if (!isTyping) {
        channelRef.current.send({
          type: "broadcast",
          event: "typing",
          payload: { user: username, typing: false },
        });
        lastTypingSentRef.current = 0;
        return;
      }

      const now = Date.now();
      if (now - lastTypingSentRef.current < 100) return;

      lastTypingSentRef.current = now;
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { user: username, typing: true },
      });

      idleTimerRef.current = setTimeout(() => {
        channelRef.current?.send({
          type: "broadcast",
          event: "typing",
          payload: { user: username, typing: false },
        });
      }, 2000);
    },
    [username]
  );

  const nukeRoom = useCallback(() => {
    if (!isCreator) return;
    channelRef.current?.send({
      type: "broadcast",
      event: "nuke",
      payload: {},
    });
  }, [isCreator]);

  const leaveRoom = useCallback(() => {
    if (lobbyChannelRef.current) {
      supabase.removeChannel(lobbyChannelRef.current);
      lobbyChannelRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const typingUsers: TypingUser[] = Object.entries(typingMap).map(
    ([user, entry]) => ({ user, text: entry.text })
  );

  return {
    messages,
    onlineUsers,
    typingUsers,
    isNuking,
    isConnected,
    isCreator,
    creator,
    sendMessage,
    sendTyping,
    nukeRoom,
    leaveRoom,
  };
}
