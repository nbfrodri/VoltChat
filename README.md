<div align="center">

<img src="app/icon.svg" alt="VoltChat" width="80" height="80" />

# VoltChat

**Anonymous. Ephemeral. Gone when you leave.**

Real-time chat with zero data persistence. No accounts, no logs, no traces.

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase_Realtime-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

---

## How It Works

VoltChat relays messages through **Supabase Realtime WebSockets** — nothing is ever stored in a database. When the last user leaves a room, every message vanishes. There is no message history, no user data, and no server-side storage.

```
User A  ──→  Supabase WebSocket  ──→  User B
              (relay only)
              zero persistence
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Ephemeral messaging** | Messages exist only in connected clients' memory |
| **Public & Private rooms** | Public rooms are discoverable; private rooms are link-only |
| **Presence tracking** | See who's online in real-time |
| **Typing indicators** | "X is typing..." with animated dots |
| **Visual message decay** | Older messages fade in opacity |
| **Nuke room** | Room creator can destroy the room with a dramatic animation |
| **Emoji picker** | Dark-themed emoji picker (lazy-loaded for performance) |
| **Responsive** | Mobile drawer sidebar + desktop layout |
| **Accessible** | ARIA roles, reduced motion, keyboard navigation |
| **Room capacity** | Optional user limit per room, editable by creator |
| **Kick & Mute** | Room creator can kick or mute users with confirmation |
| **Security hardened** | Flood detection, system message filtering, nuke validation |

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Next.js 16](https://nextjs.org/) | App Router, Turbopack, SSR |
| [TypeScript](https://www.typescriptlang.org/) | Strict mode, full type safety |
| [Tailwind CSS v4](https://tailwindcss.com/) | CSS-first theme configuration |
| [Supabase Realtime](https://supabase.com/docs/guides/realtime) | Broadcast (messaging) + Presence (online users) |
| [Lucide React](https://lucide.dev/) | Tree-shakeable icon library |
| [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | Monospace font |
| [emoji-picker-react](https://github.com/ealush/emoji-picker-react) | Emoji selection (dynamically imported) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works perfectly)

### Setup

```bash
# Clone and install
git clone https://github.com/nbfrodri/VoltChat.git
cd VoltChat
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

Add your Supabase credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **No database tables needed.** VoltChat only uses Supabase's Broadcast and Presence features — zero server-side setup required.

```bash
# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy on Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

---

## Project Structure

```
app/
├── layout.tsx             Root layout (JetBrains Mono, dark theme)
├── page.tsx               Landing page
├── globals.css            Tailwind v4 theme, animations, utilities
├── icon.svg               Favicon (lightning bolt)
└── room/[roomId]/
    └── page.tsx           Room page (join modal → chat)

components/
├── LandingPage.tsx        Create/join room + public rooms listing
├── CreateRoomModal.tsx    Public/private room creation
├── JoinModal.tsx          Username capture with validation
├── ChatInterface.tsx      Main chat orchestrator
├── MessageBubble.tsx      Individual message display
├── MessageInput.tsx       Input with lazy-loaded emoji picker
├── UserSidebar.tsx        Online users + creator crown
├── TypingIndicator.tsx    "X is typing..." with bouncing dots
├── NukeOverlay.tsx        Room destruction animation
├── SystemMessage.tsx      Join/leave system messages
└── PublicRoomCard.tsx     Public room listing card

hooks/
├── useChatRoom.ts         Core realtime (broadcast, presence, typing, nuke)
└── useLobby.ts            Public room discovery via lobby presence

lib/
├── supabase.ts            Singleton Supabase client
├── types.ts               TypeScript interfaces
└── utils.ts               Crypto room ID generation, message opacity
```

---

## Security

- Spoofed system messages are filtered at the broadcast level
- Nuke commands are validated against the known room creator
- Per-user flood detection drops excessive messages (20 msgs / 5s window)
- Room IDs use `crypto.getRandomValues()` (12 chars, ~4.7 x 10^18 combinations)
- Reserved username "system" is blocked
- All user content rendered via React JSX (auto-escaped, no `innerHTML`)
- Message and typing rate limits enforced client-side
- `strict: true` TypeScript, zero `any` types

---

## Free Tier Optimized

Designed to run within Supabase and Vercel free tier limits:

- **Typing throttle: 2000ms** (not 100ms) — dramatically reduces message count
- **State-transition typing** — only broadcasts on start/stop, not every keystroke
- **Emoji picker lazy-loaded** — ~300KB bundle loaded only when opened
- **Debounced lobby updates** — 5s debounce instead of per-presence-sync
- **Proper channel cleanup** — all subscriptions removed on unmount

---

## License

MIT
