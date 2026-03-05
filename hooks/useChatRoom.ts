"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ChatMessage, UserPresence, TypingUser, RoomVisibility, RoomTag, MessageReaction, VoteKick } from "@/lib/types";
import { encryptMessage, decryptMessage, importRoomKey } from "@/lib/crypto";

interface TypingEntry {
  text: string;
  lastSeen: number;
}

interface UseChatRoomOptions {
  roomId: string;
  username: string;
  visibility: RoomVisibility;
  initialMaxUsers?: number;
  initialTags?: RoomTag[];
  encryptionKey?: string | null;
  initialTtl?: number;
  initialRoomName?: string;
}

// Max messages from a single user in a 5-second window
const FLOOD_LIMIT = 20;
const FLOOD_WINDOW = 5000;

export function useChatRoom({ roomId, username, visibility, initialMaxUsers, initialTags, encryptionKey, initialTtl, initialRoomName }: UseChatRoomOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [typingMap, setTypingMap] = useState<Record<string, TypingEntry>>({});
  const [isNuking, setIsNuking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [creator, setCreator] = useState<string | null>(null);
  const [maxUsers, setMaxUsers] = useState<number | undefined>(initialMaxUsers);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [isNameTaken, setIsNameTaken] = useState(false);
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(false);
  const [isKicked, setIsKicked] = useState(false);
  const [kickReason, setKickReason] = useState<"creator" | "votekick" | "afk" | null>(null);
  const [roomTags, setRoomTags] = useState<RoomTag[]>(initialTags || []);
  const [isEncrypted, setIsEncrypted] = useState(!!encryptionKey);
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [ttl, setTtl] = useState<number | undefined>(initialTtl);
  const [roomCreatedAt, setRoomCreatedAt] = useState<number | undefined>(undefined);
  const [rateLimited, setRateLimited] = useState(false);
  const [activeVoteKick, setActiveVoteKick] = useState<VoteKick | null>(null);
  const [readReceipts, setReadReceipts] = useState<Record<string, string>>({});
  const [spamCooldown, setSpamCooldown] = useState(0);
  const [roomVisibility, setRoomVisibility] = useState<RoomVisibility>(visibility);
  const [roomName, setRoomName] = useState<string | undefined>(initialRoomName);
  const ownMessageTimesRef = useRef<number[]>([]);

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
  const floodMapRef = useRef<Record<string, number[]>>({});
  const maxUsersDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibilityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const knownUsersRef = useRef<Set<string>>(new Set());
  const kickedUsersRef = useRef<Set<string>>(new Set());
  const cryptoKeyRef = useRef<CryptoKey | null>(null);
  const ttlTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const afkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomNameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track room settings for creator succession
  const roomSettingsRef = useRef<{
    maxUsers?: number;
    tags?: RoomTag[];
    encrypted?: boolean;
    ttl?: number;
    roomCreatedAt?: number;
    lobbyCreatedAt?: string;
    visibility?: RoomVisibility;
    roomName?: string;
  }>({});

  // Import encryption key on mount
  useEffect(() => {
    if (!encryptionKey) return;
    importRoomKey(encryptionKey).then((key) => {
      cryptoKeyRef.current = key;
    }).catch(() => {
      // Invalid key — encryption won't work
    });
  }, [encryptionKey]);

  useEffect(() => {
    let mounted = true;

    const channel = supabase.channel(`room_${roomId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: username },
      },
    });

    channel
      .on("broadcast", { event: "shout" }, async ({ payload }) => {
        const msg = payload as ChatMessage;

        if (msg.type === "system" || msg.user === "system") return;
        if (typeof msg.text !== "string" || msg.text.length > 2000) return;
        if (typeof msg.user !== "string" || msg.user.length > 24) return;

        const now = Date.now();
        const userTimestamps = (floodMapRef.current[msg.user] || []).filter(
          (t) => now - t < FLOOD_WINDOW
        );
        if (userTimestamps.length >= FLOOD_LIMIT) return;
        floodMapRef.current[msg.user] = [...userTimestamps, now];

        // Decrypt if encrypted
        let finalMsg = msg;
        if (msg.encrypted && cryptoKeyRef.current) {
          try {
            const decrypted = await decryptMessage(msg.text, cryptoKeyRef.current);
            finalMsg = { ...msg, text: decrypted };
          } catch {
            finalMsg = { ...msg, text: "[Could not decrypt message]" };
          }
        } else if (msg.encrypted && !cryptoKeyRef.current) {
          finalMsg = { ...msg, text: "[Encrypted — you need the full room link to read this]" };
        }

        setMessages((prev) => [...prev, finalMsg]);
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
      .on("broadcast", { event: "kick" }, ({ payload }) => {
        const { sender, target } = payload as { sender: string; target: string };
        // All clients track kicked users to suppress "dissolved into nothing"
        if (target) kickedUsersRef.current.add(target);
        if (target !== username) return;
        setCreator((currentCreator) => {
          if (sender === currentCreator || sender === "votekick" || sender === "afk") {
            setKickReason(sender === "votekick" ? "votekick" : sender === "afk" ? "afk" : "creator");
            setIsKicked(true);
            supabase.removeChannel(channel);
          }
          return currentCreator;
        });
      })
      .on("broadcast", { event: "mute" }, ({ payload }) => {
        const { sender, target, muted } = payload as { sender: string; target: string; muted: boolean };
        setCreator((currentCreator) => {
          if (sender !== currentCreator) return currentCreator;
          if (target === username) {
            setIsMuted(muted);
          }
          setMutedUsers((prev) => {
            const next = new Set(prev);
            if (muted) next.add(target);
            else next.delete(target);
            return next;
          });
          if (muted) {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                text: target === username ? "You have been muted by the room creator" : `${target} has been muted`,
                user: "system",
                timestamp: Date.now(),
                type: "system",
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                text: target === username ? "You have been unmuted" : `${target} has been unmuted`,
                user: "system",
                timestamp: Date.now(),
                type: "system",
              },
            ]);
          }
          return currentCreator;
        });
      })
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const { messageId, emoji, user } = payload as MessageReaction;
        if (!messageId || !emoji || !user) return;
        setReactions((prev) => {
          if (prev.some((r) => r.messageId === messageId && r.emoji === emoji && r.user === user)) {
            return prev.filter((r) => !(r.messageId === messageId && r.emoji === emoji && r.user === user));
          }
          return [...prev, { messageId, emoji, user }];
        });
      })
      .on("broadcast", { event: "votekick_start" }, ({ payload }) => {
        const { target, initiator } = payload as { target: string; initiator: string };
        if (!target || !initiator) return;
        // Can't vote kick the creator
        setCreator((currentCreator) => {
          if (target === currentCreator) return currentCreator;
          setActiveVoteKick({
            target,
            initiator,
            votesYes: [initiator],
            votesNo: [],
            startedAt: Date.now(),
          });
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              text: `${initiator} started a vote to kick ${target}`,
              user: "system",
              timestamp: Date.now(),
              type: "system",
            },
          ]);
          return currentCreator;
        });
      })
      .on("broadcast", { event: "votekick_vote" }, ({ payload }) => {
        const { target, voter, vote } = payload as { target: string; voter: string; vote: "yes" | "no" };
        if (!target || !voter || !vote) return;
        setActiveVoteKick((prev) => {
          if (!prev || prev.target !== target) return prev;
          // Prevent double votes
          if (prev.votesYes.includes(voter) || prev.votesNo.includes(voter)) return prev;
          const updated = { ...prev };
          if (vote === "yes") {
            updated.votesYes = [...prev.votesYes, voter];
          } else {
            updated.votesNo = [...prev.votesNo, voter];
          }
          return updated;
        });
      })
      .on("broadcast", { event: "system_msg" }, ({ payload }) => {
        const { text, kickedUser } = payload as { text: string; kickedUser?: string };
        if (!text || typeof text !== "string" || text.length > 500) return;
        // Track kicked user so presence sync skips "dissolved into nothing"
        if (kickedUser) kickedUsersRef.current.add(kickedUser);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            text,
            user: "system",
            timestamp: Date.now(),
            type: "system",
          },
        ]);
      })
      .on("broadcast", { event: "read" }, ({ payload }) => {
        const { user, messageId } = payload as { user: string; messageId: string };
        if (!user || !messageId || user === username) return;
        setReadReceipts((prev) => ({ ...prev, [user]: messageId }));
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<UserPresence>();
        const users = Object.values(state)
          .flat()
          .map((p) => ({
            user: p.user,
            online_at: p.online_at,
            isCreator: p.isCreator,
            maxUsers: p.maxUsers,
            tags: p.tags,
            encrypted: p.encrypted,
            ttl: p.ttl,
            roomCreatedAt: p.roomCreatedAt,
            lastActivity: p.lastActivity,
            visibility: p.visibility,
            roomName: p.roomName,
          }));
        setOnlineUsers(users);

        const currentNames = new Set(users.map((u) => u.user));
        for (const name of currentNames) {
          if (!knownUsersRef.current.has(name) && name !== username) {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                text: `${name} joined the void`,
                user: "system",
                timestamp: Date.now(),
                type: "system",
              },
            ]);
          }
        }
        for (const name of knownUsersRef.current) {
          if (!currentNames.has(name) && name !== username) {
            // Skip "dissolved" message for users who were kicked (they already have a kick message)
            if (kickedUsersRef.current.has(name)) {
              kickedUsersRef.current.delete(name);
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  text: `${name} dissolved into nothing`,
                  user: "system",
                  timestamp: Date.now(),
                  type: "system",
                },
              ]);
            }
          }
        }
        knownUsersRef.current = currentNames;

        const creatorPresence = users.find((u) => u.isCreator);
        if (creatorPresence) {
          setMaxUsers(creatorPresence.maxUsers);
          setRoomTags(creatorPresence.tags || []);
          setIsEncrypted(!!creatorPresence.encrypted);
          if (creatorPresence.ttl) setTtl(creatorPresence.ttl);
          if (creatorPresence.roomCreatedAt) setRoomCreatedAt(creatorPresence.roomCreatedAt);
          if (creatorPresence.visibility) setRoomVisibility(creatorPresence.visibility);
          setRoomName(creatorPresence.roomName);
          // Cache room settings for potential creator succession
          roomSettingsRef.current = {
            maxUsers: creatorPresence.maxUsers,
            tags: creatorPresence.tags,
            encrypted: creatorPresence.encrypted,
            ttl: creatorPresence.ttl,
            roomCreatedAt: creatorPresence.roomCreatedAt,
            lobbyCreatedAt: roomSettingsRef.current.lobbyCreatedAt || creatorPresence.online_at,
            visibility: creatorPresence.visibility || roomSettingsRef.current.visibility,
            roomName: creatorPresence.roomName,
          };
        }

        const creatorUser = users.find((u) => u.isCreator);
        if (creatorUser) {
          setCreator(creatorUser.user);
          setIsCreator(creatorUser.user === username);
        } else if (users.length > 0) {
          // Creator left — promote the oldest user
          const sorted = [...users].sort(
            (a, b) => new Date(a.online_at).getTime() - new Date(b.online_at).getTime()
          );
          const oldest = sorted[0];
          if (oldest.user === username) {
            // I'm the oldest — promote myself using cached room settings
            const s = roomSettingsRef.current;
            const cachedVisibility = s.visibility || visibility;
            channel.track({
              user: username,
              online_at: oldest.online_at,
              isCreator: true,
              ...(s.maxUsers ? { maxUsers: s.maxUsers } : {}),
              ...(s.tags?.length ? { tags: s.tags } : {}),
              ...(s.encrypted ? { encrypted: true } : {}),
              ...(s.ttl ? { ttl: s.ttl, roomCreatedAt: s.roomCreatedAt } : {}),
              visibility: cachedVisibility,
              ...(s.roomName ? { roomName: s.roomName } : {}),
            });
            setRoomVisibility(cachedVisibility);
            setCreator(username);
            setIsCreator(true);
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                text: `${username} is now the room host`,
                user: "system",
                timestamp: Date.now(),
                type: "system",
              },
            ]);
            // For public rooms, take over lobby tracking
            if (cachedVisibility === "public" && !lobbyChannelRef.current) {
              const lobbyChannel = supabase.channel("lobby", {
                config: { presence: { key: roomId } },
              });
              lobbyChannel.subscribe(async (lobbyStatus) => {
                if (lobbyStatus === "SUBSCRIBED") {
                  await lobbyChannel.track({
                    roomId,
                    creator: username,
                    userCount: users.length,
                    users: users.map((u) => u.user),
                    createdAt: s.lobbyCreatedAt || oldest.online_at,
                    ...(s.maxUsers ? { maxUsers: s.maxUsers } : {}),
                    ...(s.tags?.length ? { tags: s.tags } : {}),
                    ...(s.encrypted ? { encrypted: true } : {}),
                    ...(s.ttl ? { ttl: s.ttl, roomCreatedAt: s.roomCreatedAt } : {}),
                    ...(s.roomName ? { roomName: s.roomName } : {}),
                  });
                }
              });
              lobbyChannelRef.current = lobbyChannel;
            }
          } else {
            // Someone else will become creator
            setCreator(null);
            setIsCreator(false);
          }
        } else {
          setCreator(null);
          setIsCreator(false);
        }

        if (lobbyChannelRef.current && creatorResolvedRef.current) {
          if (lobbyDebounceRef.current) clearTimeout(lobbyDebounceRef.current);
          lobbyDebounceRef.current = setTimeout(() => {
            if (creatorUser?.user === username && lobbyChannelRef.current) {
              lobbyChannelRef.current.track({
                roomId,
                creator: username,
                userCount: users.length,
                users: users.map((u) => u.user),
                createdAt: roomSettingsRef.current.lobbyCreatedAt || creatorUser.online_at,
                ...(creatorUser.maxUsers ? { maxUsers: creatorUser.maxUsers } : {}),
                ...(creatorUser.tags?.length ? { tags: creatorUser.tags } : {}),
                ...(creatorUser.encrypted ? { encrypted: true } : {}),
                ...(creatorUser.ttl ? { ttl: creatorUser.ttl, roomCreatedAt: creatorUser.roomCreatedAt } : {}),
                ...(creatorUser.roomName ? { roomName: creatorUser.roomName } : {}),
              });
            }
          }, 1500);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          if (!mounted) return;
          setIsConnected(true);

          await new Promise((r) => setTimeout(r, 200));
          if (!mounted) return;

          const currentState = channel.presenceState<UserPresence>();
          const existingUsers = Object.values(currentState).flat();
          const existingCreator = existingUsers.find((u) => u.isCreator);
          const amCreator = !existingCreator && existingUsers.length === 0;

          if (existingUsers.some((u) => u.user === username)) {
            setIsNameTaken(true);
            supabase.removeChannel(channel);
            return;
          }

          if (!amCreator && existingCreator?.maxUsers) {
            if (existingUsers.length >= existingCreator.maxUsers) {
              setIsRoomFull(true);
              supabase.removeChannel(channel);
              return;
            }
          }

          creatorResolvedRef.current = true;
          const createdAt = Date.now();
          if (amCreator && initialTtl) {
            setRoomCreatedAt(createdAt);
          }

          lastActivityRef.current = Date.now();
          await channel.track({
            user: username,
            online_at: new Date().toISOString(),
            isCreator: amCreator,
            lastActivity: lastActivityRef.current,
            ...(amCreator && initialMaxUsers ? { maxUsers: initialMaxUsers } : {}),
            ...(amCreator && initialTags?.length ? { tags: initialTags } : {}),
            ...(amCreator && encryptionKey ? { encrypted: true } : {}),
            ...(amCreator && initialTtl ? { ttl: initialTtl, roomCreatedAt: createdAt } : {}),
            ...(amCreator ? { visibility } : {}),
            ...(amCreator && initialRoomName ? { roomName: initialRoomName } : {}),
          });

          if (visibility === "public" && amCreator && mounted) {
            const lobbyCreatedAt = new Date().toISOString();
            roomSettingsRef.current.lobbyCreatedAt = lobbyCreatedAt;
            const lobbyChannel = supabase.channel("lobby", {
              config: { presence: { key: roomId } },
            });
            lobbyChannel.subscribe(async (lobbyStatus) => {
              if (lobbyStatus === "SUBSCRIBED" && mounted) {
                await lobbyChannel.track({
                  roomId,
                  creator: username,
                  userCount: 1,
                  users: [username],
                  createdAt: lobbyCreatedAt,
                  ...(initialMaxUsers ? { maxUsers: initialMaxUsers } : {}),
                  ...(initialTags?.length ? { tags: initialTags } : {}),
                  ...(encryptionKey ? { encrypted: true } : {}),
                  ...(initialTtl ? { ttl: initialTtl, roomCreatedAt: createdAt } : {}),
                  ...(initialRoomName ? { roomName: initialRoomName } : {}),
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
    }, 1000);

    return () => {
      mounted = false;
      if (nukeTimeoutRef.current) clearTimeout(nukeTimeoutRef.current);
      if (maxUsersDebounceRef.current) clearTimeout(maxUsersDebounceRef.current);
      if (tagsDebounceRef.current) clearTimeout(tagsDebounceRef.current);
      if (visibilityDebounceRef.current) clearTimeout(visibilityDebounceRef.current);
      if (roomNameDebounceRef.current) clearTimeout(roomNameDebounceRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (sweepIntervalRef.current) clearInterval(sweepIntervalRef.current);
      if (lobbyDebounceRef.current) clearTimeout(lobbyDebounceRef.current);
      if (ttlTimerRef.current) clearInterval(ttlTimerRef.current);
      if (afkIntervalRef.current) clearInterval(afkIntervalRef.current);
      if (activityDebounceRef.current) clearTimeout(activityDebounceRef.current);
      if (lobbyChannelRef.current) {
        lobbyChannelRef.current.untrack();
        supabase.removeChannel(lobbyChannelRef.current);
      }
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [roomId, username, visibility, initialMaxUsers, initialTags, encryptionKey, initialTtl, initialRoomName]);

  // Vote kick resolution
  useEffect(() => {
    if (!activeVoteKick) return;

    // Auto-expire vote after 30 seconds
    const timeout = setTimeout(() => {
      setActiveVoteKick((prev) => {
        if (!prev) return null;
        setMessages((msgs) => [
          ...msgs,
          {
            id: crypto.randomUUID(),
            text: `Vote to kick ${prev.target} expired`,
            user: "system",
            timestamp: Date.now(),
            type: "system",
          },
        ]);
        return null;
      });
    }, 30000);

    const totalVotes = activeVoteKick.votesYes.length + activeVoteKick.votesNo.length;
    // Others = everyone except creator, target, and initiator
    const othersCount = onlineUsers.filter(
      (u) => u.user !== creator && u.user !== activeVoteKick.target && u.user !== activeVoteKick.initiator
    ).length;
    // Initiator auto-counts as 1, plus need ceil(others / 2) additional yes votes
    const required = 1 + Math.ceil(othersCount / 2);

    if (activeVoteKick.votesYes.length >= required) {
      // Kick succeeded
      clearTimeout(timeout);
      const target = activeVoteKick.target;
      kickedUsersRef.current.add(target);

      if (target === username) {
        setKickReason("votekick");
        setIsKicked(true);
        if (channelRef.current) supabase.removeChannel(channelRef.current);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: `${target} was vote-kicked (${activeVoteKick.votesYes.length}/${totalVotes} voted yes)`,
          user: "system",
          timestamp: Date.now(),
          type: "system",
        },
      ]);

      // Broadcast a kick event so the target leaves
      if (channelRef.current && target !== username) {
        channelRef.current.send({
          type: "broadcast",
          event: "kick",
          payload: { sender: "votekick", target },
        });
      }

      setActiveVoteKick(null);
    } else if (activeVoteKick.votesNo.length > (1 + othersCount) - required) {
      // Not enough remaining to pass — vote failed
      clearTimeout(timeout);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: `Vote to kick ${activeVoteKick.target} failed`,
          user: "system",
          timestamp: Date.now(),
          type: "system",
        },
      ]);
      setActiveVoteKick(null);
    }

    return () => clearTimeout(timeout);
  }, [activeVoteKick, onlineUsers, username, creator]);

  // TTL auto-nuke timer
  useEffect(() => {
    if (!ttl || !roomCreatedAt) return;
    const ttlMs = ttl * 60 * 1000;

    ttlTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - roomCreatedAt;
      const remaining = ttlMs - elapsed;

      // 5-minute warning
      if (remaining <= 5 * 60 * 1000 && remaining > 5 * 60 * 1000 - 2000) {
        setMessages((prev) => {
          if (prev.some((m) => m.text === "Room expires in 5 minutes")) return prev;
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              text: "Room expires in 5 minutes",
              user: "system",
              timestamp: Date.now(),
              type: "system",
            },
          ];
        });
      }

      // Auto-nuke when TTL expires
      if (remaining <= 0) {
        if (ttlTimerRef.current) clearInterval(ttlTimerRef.current);
        setIsNuking(true);
        nukeTimeoutRef.current = setTimeout(() => {
          window.location.href = "/";
        }, 2800);
      }
    }, 1000);

    return () => {
      if (ttlTimerRef.current) clearInterval(ttlTimerRef.current);
    };
  }, [ttl, roomCreatedAt]);

  // AFK detection: 5min = AFK status, 15min = auto-kick
  const AFK_KICK_THRESHOLD = 15 * 60 * 1000;

  // Update lastActivity in presence (debounced to avoid excessive presence updates)
  const touchActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (activityDebounceRef.current) clearTimeout(activityDebounceRef.current);
    activityDebounceRef.current = setTimeout(() => {
      if (!channelRef.current) return;
      channelRef.current.track({
        user: username,
        online_at: new Date().toISOString(),
        isCreator,
        lastActivity: lastActivityRef.current,
        ...(isCreator && maxUsers ? { maxUsers } : {}),
        ...(isCreator && roomTags.length ? { tags: roomTags } : {}),
        ...(isEncrypted ? { encrypted: true } : {}),
        ...(isCreator && ttl ? { ttl, roomCreatedAt } : {}),
        ...(isCreator ? { visibility: roomVisibility } : {}),
        ...(isCreator && roomName ? { roomName } : {}),
      });
    }, 2000);
  }, [username, isCreator, maxUsers, roomTags, isEncrypted, ttl, roomCreatedAt, roomVisibility, roomName]);

  // Listen for user interactions to reset AFK (scroll, mouse, keyboard, touch)
  useEffect(() => {
    function handleInteraction() {
      touchActivity();
    }
    window.addEventListener("mousemove", handleInteraction, { passive: true });
    window.addEventListener("keydown", handleInteraction, { passive: true });
    window.addEventListener("scroll", handleInteraction, { passive: true, capture: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });
    window.addEventListener("click", handleInteraction, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("scroll", handleInteraction, { capture: true });
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("click", handleInteraction);
    };
  }, [touchActivity]);

  // AFK kick check interval
  useEffect(() => {
    afkIntervalRef.current = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;

      if (idle >= AFK_KICK_THRESHOLD) {
        if (afkIntervalRef.current) clearInterval(afkIntervalRef.current);
        kickedUsersRef.current.add(username);
        if (channelRef.current) {
          // Notify other clients to suppress "dissolved" and show inactivity message
          channelRef.current.send({
            type: "broadcast",
            event: "kick",
            payload: { sender: "afk", target: username },
          });
          channelRef.current.send({
            type: "broadcast",
            event: "system_msg",
            payload: { text: `${username} was removed for inactivity`, kickedUser: username },
          });
        }
        setKickReason("afk");
        setIsKicked(true);
        if (channelRef.current) {
          channelRef.current.untrack();
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      if (afkIntervalRef.current) clearInterval(afkIntervalRef.current);
    };
  }, [username]);

  const sendMessage = useCallback(
    async (text: string, replyTo?: ChatMessage) => {
      const trimmed = text.trim().slice(0, 500);
      if (!trimmed || !channelRef.current || isMuted) return;

      const now = Date.now();
      if (now - lastMessageSentRef.current < 250) return;
      lastMessageSentRef.current = now;

      touchActivity();

      // Check rate limit if rateLimited flag is recently set
      if (rateLimited) return;

      // Spam cooldown check
      if (spamCooldown > 0) return;

      // Track own message timestamps for spam detection
      const SPAM_WINDOW = 3000;
      const SPAM_LIMIT = 5;
      const SPAM_COOLDOWN = 5000;
      ownMessageTimesRef.current = ownMessageTimesRef.current.filter((t) => now - t < SPAM_WINDOW);
      ownMessageTimesRef.current.push(now);
      if (ownMessageTimesRef.current.length > SPAM_LIMIT) {
        setSpamCooldown(SPAM_COOLDOWN);
        const timer = setInterval(() => {
          setSpamCooldown((prev) => {
            if (prev <= 1000) { clearInterval(timer); return 0; }
            return prev - 1000;
          });
        }, 1000);
        return;
      }

      let finalText = trimmed;
      let encrypted = false;

      if (cryptoKeyRef.current) {
        try {
          finalText = await encryptMessage(trimmed, cryptoKeyRef.current);
          encrypted = true;
        } catch {
          // Encryption failed — send plaintext
        }
      }

      const payload: ChatMessage = {
        id: crypto.randomUUID(),
        text: finalText,
        user: username,
        timestamp: Date.now(),
        type: "message",
        ...(encrypted ? { encrypted: true } : {}),
        ...(replyTo ? {
          replyTo: {
            id: replyTo.id,
            user: replyTo.user,
            text: replyTo.text.slice(0, 100),
          },
        } : {}),
      };

      channelRef.current.send({
        type: "broadcast",
        event: "shout",
        payload,
      });
    },
    [username, isMuted, rateLimited, touchActivity, spamCooldown]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current) return;

      if (isTyping) touchActivity();

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      if (!isTyping) {
        if (!typingStateRef.current) return;
        typingStateRef.current = false;
        channelRef.current.send({
          type: "broadcast",
          event: "typing",
          payload: { user: username, typing: false },
        });
        lastTypingSentRef.current = 0;
        return;
      }

      const now = Date.now();
      if (now - lastTypingSentRef.current < 1200) return;

      typingStateRef.current = true;
      lastTypingSentRef.current = now;
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { user: username, typing: true },
      });

      idleTimerRef.current = setTimeout(() => {
        if (typingStateRef.current) {
          typingStateRef.current = false;
          channelRef.current?.send({
            type: "broadcast",
            event: "typing",
            payload: { user: username, typing: false },
          });
        }
      }, 2000);
    },
    [username, touchActivity]
  );

  const nukeRoom = useCallback(() => {
    if (!isCreator) return;
    channelRef.current?.send({
      type: "broadcast",
      event: "nuke",
      payload: { sender: username },
    });
  }, [isCreator, username]);

  const updateMaxUsers = useCallback(
    (newMax: number | undefined) => {
      if (!isCreator || !channelRef.current) return;
      setMaxUsers(newMax);
      if (maxUsersDebounceRef.current) clearTimeout(maxUsersDebounceRef.current);
      maxUsersDebounceRef.current = setTimeout(() => {
        channelRef.current?.track({
          user: username,
          online_at: new Date().toISOString(),
          isCreator: true,
          ...(newMax ? { maxUsers: newMax } : {}),
          ...(roomTags.length ? { tags: roomTags } : {}),
          ...(isEncrypted ? { encrypted: true } : {}),
          ...(ttl ? { ttl, roomCreatedAt } : {}),
          visibility: roomVisibility,
          ...(roomName ? { roomName } : {}),
        });
      }, 300);
    },
    [isCreator, username, roomTags, isEncrypted, ttl, roomCreatedAt, roomVisibility, roomName]
  );

  const updateTags = useCallback(
    (tags: RoomTag[]) => {
      if (!isCreator || !channelRef.current) return;
      setRoomTags(tags);
      if (tagsDebounceRef.current) clearTimeout(tagsDebounceRef.current);
      tagsDebounceRef.current = setTimeout(() => {
        channelRef.current?.track({
          user: username,
          online_at: new Date().toISOString(),
          isCreator: true,
          ...(maxUsers ? { maxUsers } : {}),
          ...(tags.length ? { tags } : {}),
          ...(isEncrypted ? { encrypted: true } : {}),
          ...(ttl ? { ttl, roomCreatedAt } : {}),
          visibility: roomVisibility,
          ...(roomName ? { roomName } : {}),
        });
      }, 300);
    },
    [isCreator, username, maxUsers, isEncrypted, ttl, roomCreatedAt, roomVisibility, roomName]
  );

  const updateVisibility = useCallback(
    (newVisibility: RoomVisibility) => {
      if (!isCreator || !channelRef.current) return;
      // E2EE rooms cannot become public
      if (newVisibility === "public" && isEncrypted) return;
      if (newVisibility === roomVisibility) return;

      setRoomVisibility(newVisibility);

      // Clear tags when going private (tags are public-only)
      let currentTags = roomTags;
      if (newVisibility === "private" && roomTags.length > 0) {
        currentTags = [];
        setRoomTags([]);
      }

      if (visibilityDebounceRef.current) clearTimeout(visibilityDebounceRef.current);
      visibilityDebounceRef.current = setTimeout(() => {
        // Re-track creator presence with new visibility
        channelRef.current?.track({
          user: username,
          online_at: new Date().toISOString(),
          isCreator: true,
          ...(maxUsers ? { maxUsers } : {}),
          ...(currentTags.length ? { tags: currentTags } : {}),
          ...(isEncrypted ? { encrypted: true } : {}),
          ...(ttl ? { ttl, roomCreatedAt } : {}),
          visibility: newVisibility,
          ...(roomName ? { roomName } : {}),
        });

        if (newVisibility === "private") {
          // Public → Private: remove from lobby
          if (lobbyChannelRef.current) {
            lobbyChannelRef.current.untrack();
            supabase.removeChannel(lobbyChannelRef.current);
            lobbyChannelRef.current = null;
          }
        } else {
          // Private → Public: create lobby channel
          if (!lobbyChannelRef.current) {
            const lobbyCreatedAt = roomSettingsRef.current.lobbyCreatedAt || new Date().toISOString();
            roomSettingsRef.current.lobbyCreatedAt = lobbyCreatedAt;
            const lobbyChannel = supabase.channel("lobby", {
              config: { presence: { key: roomId } },
            });
            lobbyChannel.subscribe(async (lobbyStatus) => {
              if (lobbyStatus === "SUBSCRIBED") {
                const state = channelRef.current?.presenceState<UserPresence>();
                const users = state ? Object.values(state).flat() : [];
                await lobbyChannel.track({
                  roomId,
                  creator: username,
                  userCount: users.length || 1,
                  users: users.length ? users.map((u) => u.user) : [username],
                  createdAt: lobbyCreatedAt,
                  ...(maxUsers ? { maxUsers } : {}),
                  ...(currentTags.length ? { tags: currentTags } : {}),
                  ...(isEncrypted ? { encrypted: true } : {}),
                  ...(ttl ? { ttl, roomCreatedAt } : {}),
                  ...(roomName ? { roomName } : {}),
                });
              }
            });
            lobbyChannelRef.current = lobbyChannel;
          }
        }

        // Broadcast system message
        channelRef.current?.send({
          type: "broadcast",
          event: "system_msg",
          payload: { text: `Room is now ${newVisibility}` },
        });
      }, 300);
    },
    [isCreator, username, maxUsers, roomTags, isEncrypted, ttl, roomCreatedAt, roomVisibility, roomId, roomName]
  );

  const updateRoomName = useCallback(
    (newName: string | undefined) => {
      if (!isCreator || !channelRef.current) return;
      const sanitized = newName?.slice(0, 40) || undefined;
      setRoomName(sanitized);
      roomSettingsRef.current.roomName = sanitized;
      if (roomNameDebounceRef.current) clearTimeout(roomNameDebounceRef.current);
      roomNameDebounceRef.current = setTimeout(() => {
        channelRef.current?.track({
          user: username,
          online_at: new Date().toISOString(),
          isCreator: true,
          ...(maxUsers ? { maxUsers } : {}),
          ...(roomTags.length ? { tags: roomTags } : {}),
          ...(isEncrypted ? { encrypted: true } : {}),
          ...(ttl ? { ttl, roomCreatedAt } : {}),
          visibility: roomVisibility,
          ...(sanitized ? { roomName: sanitized } : {}),
        });
        // Update lobby if public
        if (roomVisibility === "public" && lobbyChannelRef.current) {
          const state = channelRef.current?.presenceState<UserPresence>();
          const users = state ? Object.values(state).flat() : [];
          lobbyChannelRef.current.track({
            roomId,
            creator: username,
            userCount: users.length || 1,
            users: users.length ? users.map((u) => u.user) : [username],
            createdAt: roomSettingsRef.current.lobbyCreatedAt || new Date().toISOString(),
            ...(maxUsers ? { maxUsers } : {}),
            ...(roomTags.length ? { tags: roomTags } : {}),
            ...(isEncrypted ? { encrypted: true } : {}),
            ...(ttl ? { ttl, roomCreatedAt } : {}),
            ...(sanitized ? { roomName: sanitized } : {}),
          });
        }
      }, 300);
    },
    [isCreator, username, maxUsers, roomTags, isEncrypted, ttl, roomCreatedAt, roomVisibility, roomId]
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: "broadcast",
        event: "reaction",
        payload: { messageId, emoji, user: username },
      });
    },
    [username]
  );

  const kickUser = useCallback(
    (target: string) => {
      if (!isCreator || !channelRef.current || target === username) return;
      kickedUsersRef.current.add(target);
      channelRef.current.send({
        type: "broadcast",
        event: "kick",
        payload: { sender: username, target },
      });
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: `${target} was kicked from the room`,
          user: "system",
          timestamp: Date.now(),
          type: "system",
        },
      ]);
    },
    [isCreator, username]
  );

  const startVoteKick = useCallback(
    (target: string) => {
      if (!channelRef.current || target === username || isCreator) return;
      // Can't start if there's already an active vote
      if (activeVoteKick) return;
      channelRef.current.send({
        type: "broadcast",
        event: "votekick_start",
        payload: { target, initiator: username },
      });
    },
    [username, isCreator, activeVoteKick]
  );

  const castVoteKick = useCallback(
    (target: string, vote: "yes" | "no") => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: "broadcast",
        event: "votekick_vote",
        payload: { target, voter: username, vote },
      });
      // Also update local state immediately
      setActiveVoteKick((prev) => {
        if (!prev || prev.target !== target) return prev;
        if (prev.votesYes.includes(username) || prev.votesNo.includes(username)) return prev;
        const updated = { ...prev };
        if (vote === "yes") {
          updated.votesYes = [...prev.votesYes, username];
        } else {
          updated.votesNo = [...prev.votesNo, username];
        }
        return updated;
      });
    },
    [username]
  );

  const muteUser = useCallback(
    (target: string, muted: boolean) => {
      if (!isCreator || !channelRef.current || target === username) return;
      channelRef.current.send({
        type: "broadcast",
        event: "mute",
        payload: { sender: username, target, muted },
      });
    },
    [isCreator, username]
  );

  const markAsRead = useCallback(
    (messageId: string) => {
      if (!channelRef.current) return;
      // Update own receipt locally
      setReadReceipts((prev) => {
        if (prev[username] === messageId) return prev;
        return { ...prev, [username]: messageId };
      });
      channelRef.current.send({
        type: "broadcast",
        event: "read",
        payload: { user: username, messageId },
      });
    },
    [username]
  );

  const leaveRoom = useCallback(() => {
    if (lobbyChannelRef.current) {
      lobbyChannelRef.current.untrack();
      supabase.removeChannel(lobbyChannelRef.current);
      lobbyChannelRef.current = null;
    }
    if (channelRef.current) {
      channelRef.current.untrack();
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
    maxUsers,
    isRoomFull,
    isNameTaken,
    isMuted,
    isKicked,
    kickReason,
    mutedUsers,
    roomTags,
    isEncrypted,
    reactions,
    ttl,
    roomCreatedAt,
    rateLimited,
    setRateLimited,
    sendMessage,
    sendTyping,
    nukeRoom,
    leaveRoom,
    updateMaxUsers,
    updateTags,
    roomVisibility,
    updateVisibility,
    roomName,
    updateRoomName,
    activeVoteKick,
    toggleReaction,
    kickUser,
    muteUser,
    startVoteKick,
    castVoteKick,
    readReceipts,
    markAsRead,
    spamCooldown,
  };
}
