import type { ChatMessage } from "@/lib/types";
import { getUserColor } from "@/lib/utils";

interface SystemMessageProps {
  message: ChatMessage;
}

// Patterns where the message starts with a username
const USER_PREFIX_PATTERNS = [
  / joined the void$/,
  / dissolved into nothing$/,
  / is now the room host$/,
  / has been muted$/,
  / has been unmuted$/,
  / was kicked from the room$/,
  / was vote-kicked /,
  / started a vote to kick /,
  / was removed for inactivity$/,
];

function renderSystemText(text: string) {
  // Check if message matches "Username <action>" pattern
  for (const pattern of USER_PREFIX_PATTERNS) {
    const match = text.match(pattern);
    if (match && match.index !== undefined && match.index > 0) {
      const username = text.slice(0, match.index);
      const rest = text.slice(match.index);

      // Check for a second username in "started a vote to kick <target>"
      const voteKickMatch = rest.match(/^ started a vote to kick (.+)$/);
      if (voteKickMatch) {
        const target = voteKickMatch[1];
        return (
          <>
            <span className={getUserColor(username)}>{username}</span>
            <span> started a vote to kick </span>
            <span className={getUserColor(target)}>{target}</span>
          </>
        );
      }

      // "was vote-kicked (X/Y voted yes)"
      const voteKickedMatch = rest.match(/^ was vote-kicked (.+)$/);
      if (voteKickedMatch) {
        return (
          <>
            <span className={getUserColor(username)}>{username}</span>
            <span> was vote-kicked {voteKickedMatch[1]}</span>
          </>
        );
      }

      return (
        <>
          <span className={getUserColor(username)}>{username}</span>
          <span>{rest}</span>
        </>
      );
    }
  }

  // "Vote to kick <target> expired/failed"
  const voteExpiredMatch = text.match(/^Vote to kick (.+?) (expired|failed)$/);
  if (voteExpiredMatch) {
    const target = voteExpiredMatch[1];
    const result = voteExpiredMatch[2];
    return (
      <>
        <span>Vote to kick </span>
        <span className={getUserColor(target)}>{target}</span>
        <span> {result}</span>
      </>
    );
  }

  // No username to colorize
  return <span>{text}</span>;
}

export default function SystemMessage({ message }: SystemMessageProps) {
  return (
    <div role="note" className="flex justify-center py-1 animate-slide-in">
      <span className="text-purple-400/70 italic text-xs">
        {renderSystemText(message.text)}
      </span>
    </div>
  );
}
