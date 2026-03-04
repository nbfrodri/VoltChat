export interface ChatMessage {
  id: string;
  text: string;
  user: string;
  timestamp: number;
  type: "message" | "system";
}

export interface UserPresence {
  user: string;
  online_at: string;
  isCreator?: boolean;
  maxUsers?: number;
}

export interface TypingUser {
  user: string;
  text: string;
}

export type RoomVisibility = "public" | "private";

export interface PublicRoom {
  roomId: string;
  creator: string;
  userCount: number;
  createdAt: string;
  maxUsers?: number;
}
