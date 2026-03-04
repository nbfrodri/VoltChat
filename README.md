# VoltChat

Anonymous, ephemeral real-time chat. No accounts. No logs. Gone when you leave.

## Features

- **Zero persistence** — Messages are relayed via WebSockets, never stored in a database
- **Real-time chat** — Instant messaging powered by Supabase Realtime Broadcast
- **Public & Private rooms** — Public rooms are discoverable on the landing page; private rooms are link-only
- **Presence tracking** — See who's online in real-time via Supabase Presence
- **Typing indicators** — See when others are typing (no text preview, just "is typing...")
- **Visual message decay** — Older messages fade in opacity, reinforcing ephemerality
- **Nuke room** — Room creator can destroy the room with a dramatic animation, kicking everyone
- **Emoji support** — Built-in emoji picker with dark theme
- **Responsive** — Works on mobile and desktop with a drawer sidebar
- **Accessible** — ARIA roles, reduced motion support, keyboard navigation

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 (CSS-first config)
- **Realtime:** Supabase Realtime (Broadcast + Presence)
- **Icons:** Lucide React
- **Font:** JetBrains Mono

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/nbf_rodri/VoltChat.git
   cd VoltChat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` from the example:
   ```bash
   cp .env.local.example .env.local
   ```

4. Add your Supabase credentials to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   > No database tables needed — VoltChat only uses Supabase's Broadcast and Presence features which require zero server-side setup.

5. Run the dev server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Deploy on Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Project Structure

```
app/
  layout.tsx          # Root layout (JetBrains Mono, dark theme)
  page.tsx            # Landing page
  globals.css         # Tailwind v4 theme, animations, utilities
  icon.svg            # Favicon (lightning bolt)
  room/[roomId]/
    page.tsx          # Room page (join modal + chat)

components/
  LandingPage.tsx     # Create/join room, public rooms listing
  CreateRoomModal.tsx # Public/private room creation
  JoinModal.tsx       # Username capture
  ChatInterface.tsx   # Main chat layout
  MessageBubble.tsx   # Individual message display
  MessageInput.tsx    # Input with emoji picker
  UserSidebar.tsx     # Online users with creator crown
  TypingIndicator.tsx # "X is typing..." with bouncing dots
  NukeOverlay.tsx     # Room destruction animation
  SystemMessage.tsx   # Join/leave system messages
  PublicRoomCard.tsx  # Public room listing card

hooks/
  useChatRoom.ts      # Core realtime hook (broadcast, presence, typing, nuke)
  useLobby.ts         # Public room discovery via lobby presence

lib/
  supabase.ts         # Singleton Supabase client
  types.ts            # TypeScript interfaces
  utils.ts            # Room ID generation, message opacity
```

## License

MIT
