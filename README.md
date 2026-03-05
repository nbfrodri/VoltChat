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
| **End-to-end encryption** | Optional AES-GCM 256-bit E2EE for private rooms (key in URL fragment, never touches server) |
| **Presence tracking** | See who's online in real-time with colored usernames |
| **Typing indicators** | "X is typing..." with animated dots |
| **Visual message decay** | Older messages fade in opacity |
| **Swipe-to-reply** | WhatsApp-style swipe gesture on mobile to reply to messages |
| **Message reactions** | React to messages with emoji (thumbs up, heart, laugh, wow, sad, fire) |
| **Reply threads** | Reply to specific messages with quote previews |
| **Read receipts** | User avatars appear below messages when read |
| **User silence** | Locally hide messages from specific users (client-side only) |
| **Nuke room** | Room creator can destroy the room with a dramatic animation |
| **Vote kick** | Non-creator users can initiate vote kicks (50% majority of eligible voters) |
| **Kick & Mute** | Room creator can kick or mute users with confirmation |
| **AFK detection** | 5min AFK warning, 15min auto-kick with system message |
| **Creator succession** | When the creator leaves, the oldest user auto-promotes with full powers and room settings |
| **Room themes** | 6 color themes (Emerald, Ocean, Violet, Rose, Amber, Cyan) affecting 25+ UI elements |
| **Room tags** | Custom tags for public rooms with colors and emoji |
| **Room TTL** | Optional room auto-expiry (30min to 24h) with live countdown |
| **Room capacity** | Optional user limit per room, editable by creator |
| **Content filter** | Opt-in client-side profanity filter (3 levels) |
| **Report system** | Report rooms for abuse; auto-terminates after 5 reports |
| **Share room** | Copy link, QR code, WhatsApp, Telegram, X, Email sharing |
| **Room bookmarks** | Save rooms locally for quick access |
| **Help guide** | Comprehensive interactive help covering all features (press ?) |
| **Emoji picker** | Dark-themed emoji picker (lazy-loaded for performance) |
| **PWA support** | Install as app, offline fallback page |
| **Responsive** | Mobile bottom sheets + desktop sidebar layout |
| **Accessible** | ARIA roles, reduced motion, keyboard navigation |
| **Security hardened** | Flood detection, rate limiting, nuke validation, kicked user tracking |

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Next.js 16](https://nextjs.org/) | App Router, Turbopack, SSR |
| [TypeScript](https://www.typescriptlang.org/) | Strict mode, full type safety |
| [Tailwind CSS v4](https://tailwindcss.com/) | CSS-first theme configuration |
| [Supabase Realtime](https://supabase.com/docs/guides/realtime) | Broadcast (messaging) + Presence (online users) |
| [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) | AES-GCM 256-bit E2EE |
| [Lucide React](https://lucide.dev/) | Tree-shakeable icon library |
| [qrcode](https://www.npmjs.com/package/qrcode) | QR code generation for room sharing |
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
REPORT_WEBHOOK_URL=https://discord.com/api/webhooks/...  # Optional
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
   - `REPORT_WEBHOOK_URL` (optional)
4. Deploy

---

## Project Structure

```
app/
├── layout.tsx             Root layout (JetBrains Mono, dark theme, PWA)
├── page.tsx               Landing page
├── globals.css            Tailwind v4 theme, animations, utilities
├── icon.svg               Favicon (lightning bolt)
├── terms/page.tsx         Terms of service
├── ethics/page.tsx        Ethics report
├── api/report/route.ts    Abuse report endpoint
├── api/rate-check/route.ts Rate limit endpoint
└── room/[roomId]/
    └── page.tsx           Room page (join modal → chat)

components/
├── LandingPage.tsx        Create/join room + bookmarks + public rooms
├── CreateRoomModal.tsx    Room creation (visibility, encryption, TTL, tags, capacity)
├── JoinModal.tsx          Username capture with validation (no spaces)
├── ChatInterface.tsx      Main chat orchestrator (theme-aware, silence support)
├── MessageBubble.tsx      Message bubble + swipe-to-reply + inline timestamp
├── MessageInput.tsx       Input with emoji picker (theme-aware, self-mention prevention)
├── UserSidebar.tsx        Users Online (colored names) + kick/mute/silence
├── TypingIndicator.tsx    "X is typing..." with themed dots
├── NukeOverlay.tsx        Room destruction animation
├── SystemMessage.tsx      System messages with colored usernames
├── PublicRoomCard.tsx     Public room card with live TTL countdown
├── ShareModal.tsx         Share room (link, QR, social)
├── ReportModal.tsx        Abuse report with auto-terminate
├── TagBadge.tsx           Tag pill badge component
├── TagManager.tsx         Tag CRUD modal
├── BottomSheet.tsx        Mobile bottom sheet
├── ShortcutsOverlay.tsx   Help guide overlay (6 sections)
└── SafetyDisclaimer.tsx   First-visit safety modal

hooks/
├── useChatRoom.ts         Core realtime (broadcast, presence, E2EE, reactions, vote kick, TTL, succession, AFK, read receipts)
├── useLobby.ts            Public room discovery via lobby presence (join/leave/sync)
├── useBookmarks.ts        Room bookmark management
├── useKeyboardShortcuts.ts Keyboard shortcut handler
├── useResizable.ts        Resizable sidebar
└── useSwipeGesture.ts     Touch swipe detection

lib/
├── supabase.ts            Singleton Supabase client
├── types.ts               TypeScript interfaces
├── utils.ts               Room ID generation, message opacity, user colors, username validation
├── crypto.ts              E2EE: AES-GCM encrypt/decrypt, key gen/import
├── content-filter.ts      Opt-in profanity filter
├── rate-limit.ts          In-memory rate limiter
├── themes.ts              Per-room color theme system (25+ properties)
├── haptics.ts             Haptic feedback helpers
└── qrcode.ts              QR code generator (async, qrcode npm)
```

---

## Security

- **E2EE support** — AES-GCM 256-bit encryption; key lives in URL fragment, never sent to server
- Spoofed system messages are filtered at the broadcast level
- Nuke commands are validated against the known room creator
- Per-user flood detection drops excessive messages (20 msgs / 5s window)
- Room IDs use `crypto.getRandomValues()` (12 chars, ~4.7 x 10^18 combinations)
- Reserved username "system" is blocked; no spaces allowed in usernames
- All user content rendered via React JSX (auto-escaped, no `innerHTML`)
- Server-side rate limiting on reports and room creation
- Vote kick requires majority consensus (excludes creator and target from pool)
- Report auto-terminate after 5 reports per room
- Room visibility stored in presence to prevent URL manipulation
- Kicked users tracked to prevent false system messages
- `strict: true` TypeScript, zero `any` types

---

## Free Tier Optimized

Designed to run within Supabase and Vercel free tier limits:

- **Typing throttle: 1200ms** — reduces message count
- **State-transition typing** — only broadcasts on start/stop, not every keystroke
- **Emoji picker lazy-loaded** — ~300KB bundle loaded only when opened
- **Debounced lobby updates** — 1.5s debounce instead of per-presence-sync
- **Proper channel cleanup** — all subscriptions removed on unmount

---

## Built With

This project was built with the help of **Claude Opus 4.6** (by Anthropic) for educational purposes, for fun, and as a learning experience.

---

## License

MIT
