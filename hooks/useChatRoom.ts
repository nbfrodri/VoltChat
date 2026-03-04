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

// Max messages from a single user in a 5-second window
const FLOOD_LIMIT = 20;
const FLOOD_WINDOW = 5000;

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
  const typingStateRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sweepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const creatorResolvedRef = useRef(false);
  const lobbyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMessageSentRef = useRef(0);
  // Flood detection: track message timestamps per user
  const floodMapRef = useRef<Record<string, number[]>>({});

  useEffect(() => {
    let mounted = true;

    const channel = supabase.channel(`room_${roomId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: username },
      },
    });

    channel
      .on("broadcast", { event: "shout" }, ({ payload }) => {
        const msg = payload as ChatMessage;

        // Security: reject spoofed system messages from broadcast
        if (msg.type === "system" || msg.user === "system") return;

        // Flood detection: drop messages from users exceeding rate
        const now = Date.now();
        const userTimestamps = (floodMapRef.current[msg.user] || []).filter(
          (t) => now - t < FLOOD_WINDOW
        );
        if (userTimestamps.length >= FLOOD_LIMIT) return;
        floodMapRef.current[msg.user] = [...userTimestamps, now];

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
        if (user === username || user === "system") return;
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
      .on("broadcast", { event: "nuke" }, ({ payload }) => {
        // Security: validate nuke sender matches known creator
        const sender = (payload as { sender?: string }).sender;
        if (!sender) return;
        setCreator((currentCreator) => {
          if (sender === currentCreator) {
            setIsNuking(true);
            nukeTimeoutRef.current = setTimeout(() => {
              window.location.href = "/";
            }, 2800);
          }
          return currentCreator;
        });
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

        // Creator is the single source of truth from presence metadata
        const creatorUser = users.find((u) => u.isCreator);
        if (creatorUser) {
          setCreator(creatorUser.user);
          setIsCreator(creatorUser.user === username);
        } else {
          // No creator present — nobody can nuke
          setCreator(null);
          setIsCreator(false);
        }

        // Debounced lobby update (5s) to avoid excessive messages
        if (visibility === "public" && lobbyChannelRef.current && creatorResolvedRef.current) {
          if (lobbyDebounceRef.current) clearTimeout(lobbyDebounceRef.current);
          lobbyDebounceRef.current = setTimeout(() => {
            if (creatorUser?.user === username && lobbyChannelRef.current) {
              lobbyChannelRef.current.track({
                roomId,
                creator: username,
                userCount: users.length,
                createdAt: new Date().toISOString(),
              });
            }
          }, 5000);
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
          if (!mounted) return;
          setIsConnected(true);

          // Wait briefly for presence state to sync before deciding creator
          await new Promise((r) => setTimeout(r, 500));
          if (!mounted) return;

          const currentState = channel.presenceState<UserPresence>();
          const existingUsers = Object.values(currentState).flat();
          // Only become creator if no one else already has isCreator
          const existingCreator = existingUsers.find((u) => u.isCreator);
          const amCreator = !existingCreator && existingUsers.length === 0;

          creatorResolvedRef.current = true;

          await channel.track({
            user: username,
            online_at: new Date().toISOString(),
            isCreator: amCreator,
          });

          // If public + creator, join lobby
          if (visibility === "public" && amCreator && mounted) {
            const lobbyChannel = supabase.channel("lobby", {
              config: { presence: { key: roomId } },
            });
            lobbyChannel.subscribe(async (lobbyStatus) => {
              if (lobbyStatus === "SUBSCRIBED" && mounted) {
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

    // Sweep stale typing entries every 2s (reduced from 500ms)
    sweepIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setTypingMap((prev) => {
        const next: Record<string, TypingEntry> = {};
        let changed = false;
        for (const [key, val] of Object.entries(prev)) {
          if (now - val.lastSeen < 3000) {
            next[key] = val;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 2000);

    return () => {
      mounted = false;
      if (nukeTimeoutRef.current) clearTimeout(nukeTimeoutRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (sweepIntervalRef.current) clearInterval(sweepIntervalRef.current);
      if (lobbyDebounceRef.current) clearTimeout(lobbyDebounceRef.current);
      if (lobbyChannelRef.current) supabase.removeChannel(lobbyChannelRef.current);
      supabase.removeChannel(channel);
    };
  }, [roomId, username, visibility]);

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

      // Only send on state transitions to reduce broadcasts
      if (!isTyping) {
        if (!typingStateRef.current) return; // Already not typing, skip
        typingStateRef.current = false;
        channelRef.current.send({
          type: "broadcast",
          event: "typing",
          payload: { user: username, typing: false },
        });
        lastTypingSentRef.current = 0;
        return;
      }

      // Throttle: max once per 2000ms (optimized for free tier)
      const now = Date.now();
      if (now - lastTypingSentRef.current < 2000) return;

      typingStateRef.current = true;
      lastTypingSentRef.current = now;
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { user: username, typing: true },
      });

      // Auto-clear after 3s idle
      idleTimerRef.current = setTimeout(() => {
        if (typingStateRef.current) {
          typingStateRef.current = false;
          channelRef.current?.send({
            type: "broadcast",
            event: "typing",
            payload: { user: username, typing: false },
          });
        }
      }, 3000);
    },
    [username]
  );

  const nukeRoom = useCallback(() => {
    if (!isCreator) return;
    channelRef.current?.send({
      type: "broadcast",
      event: "nuke",
      payload: { sender: username },
    });
  }, [isCreator, username]);

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
