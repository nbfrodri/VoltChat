export interface ChatMessage {
  id: string;
  text: string;
  user: string;
  timestamp: number;
  type: "message" | "system";
  /** If this message is a reply, the ID + preview of the original message */
  replyTo?: {
    id: string;
    user: string;
    text: string;
  };
  /** Whether the text is encrypted (E2EE rooms) */
  encrypted?: boolean;
}

export interface MessageReaction {
  messageId: string;
  emoji: string;
  user: string;
}

export interface UserPresence {
  user: string;
  online_at: string;
  isCreator?: boolean;
  maxUsers?: number;
  tags?: RoomTag[];
  /** Whether the room uses E2E encryption */
  encrypted?: boolean;
  /** Room TTL in minutes (0 = no expiry) */
  ttl?: number;
  /** Room creation timestamp (for TTL calculation) */
  roomCreatedAt?: number;
  /** Last activity timestamp for AFK detection */
  lastActivity?: number;
  /** Room visibility set by creator */
  visibility?: RoomVisibility;
}

export interface TypingUser {
  user: string;
  text: string;
}

export type RoomVisibility = "public" | "private";

export interface RoomTag {
  id: string;
  label: string;
  emoji?: string;
  color: string;
}

export interface VoteKick {
  target: string;
  initiator: string;
  votesYes: string[];
  votesNo: string[];
  startedAt: number;
}

export interface PublicRoom {
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
}
