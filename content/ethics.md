# VoltChat — Ethical Usage Report

## 1. Executive Summary

VoltChat is an anonymous, ephemeral real-time chat application designed around a single principle: **zero data persistence**. No messages are stored in any database. No user accounts exist. No cookies, sessions, or analytics are collected. All communication occurs via Supabase Realtime (Broadcast & Presence), and once participants disconnect, the conversation ceases to exist.

The intent behind VoltChat is to provide a space for privacy-respecting, low-friction communication — useful for ad-hoc coordination, candid discussions, and scenarios where users want to communicate without leaving a digital footprint.

However, anonymity is inherently double-edged. The same properties that protect a whistleblower or enable candid conversation also lower the cost of harassment, abuse, and other harmful behaviors. This document provides an honest assessment of VoltChat's ethical landscape: the risks its design introduces, the mitigations currently in place, the gaps that remain, and actionable recommendations for responsible operation.

This is an internal transparency document, not a marketing artifact.

---

## 2. Threat Model

### 2.1 Harassment & Bullying

**Risk:** Anonymous users can direct abusive language, threats, or sustained harassment at others in a room with no fear of identity exposure or lasting consequences.

**Current mitigations:**
- **Creator moderation:** Room creators can **kick** and **mute** abusive users, removing them from the conversation immediately.
- **Room capacity limits:** Rooms have a maximum participant count, limiting the scale of coordinated pile-on behavior.
- **No persistent identity:** There is no user profile to stalk, no message history to weaponize, and no way to follow a user across rooms. Once someone leaves, they are effectively a new person.
- **Ephemeral rooms:** Abusive rooms have a natural shelf life. They do not persist, are not indexed, and cannot be discovered via search.

**Residual risk:** Within an active session, a target can still experience real harm before a creator intervenes. If the creator is the abuser, there is no recourse for other participants beyond leaving the room.

### 2.2 Illegal Content Sharing

**Risk:** Users could share illegal content (CSAM references, pirated material links, drug solicitation) via chat messages.

**Current mitigations:**
- **No file uploads:** VoltChat transmits only text via Broadcast events. There is no mechanism to upload, host, or distribute files of any kind.
- **No persistent storage:** Illegal text content is not written to any database. It exists only in the in-memory state of connected clients and vanishes when participants disconnect or refresh.
- **No indexing:** Room content is not crawled, indexed, or cached by the application.

**Residual risk:** Users can still share URLs pointing to external illegal content. The ephemeral nature means no audit trail exists for law enforcement, which is both a privacy feature and a liability concern.

### 2.3 Coordination of Harm

**Risk:** Bad actors could use VoltChat to coordinate illegal or harmful activities (e.g., planning violence, organizing harassment campaigns) specifically because no records are kept.

**Current mitigations:**
- **Ephemeral nature:** There is no persistent channel that a group can return to. Coordination requires sharing a room ID through external means each time.
- **Random room IDs:** 6-character alphanumeric room IDs are randomly generated and not guessable at scale. Rooms cannot be discovered without knowing the exact ID.
- **No room persistence:** Rooms do not survive participant disconnection. There is no "always-on" channel for sustained coordination.

**Residual risk:** This is a genuine concern. Determined actors can share room IDs via external channels and use VoltChat for short-burst coordination. The lack of any logging means there is no forensic trail. This is an inherent consequence of the zero-data design, and it must be acknowledged rather than dismissed.

### 2.4 Minor Safety

**Risk:** Minors could access VoltChat and be exposed to inappropriate content or predatory behavior from anonymous adults.

**Current mitigations:**
- **No personal data collection:** There are no accounts, no profiles, no age fields, and no personally identifiable information stored. This limits the surface area for grooming or data harvesting targeting minors.
- **No account system:** There is no friend list, no direct messaging, and no way to build persistent relationships that predators typically exploit.
- **No discoverability:** Rooms are not listed publicly in a browsable directory (public rooms are visible but still require active navigation). There is no "random chat" matchmaking that pairs strangers one-on-one.

**Residual risk:** There is no age verification. Minors can enter any room if they have the room ID. If a room is set to public, anyone can join. VoltChat provides no special protections for minors beyond its general design constraints.

### 2.5 Doxxing / PII Sharing

**Risk:** Users could share another person's personally identifiable information (address, phone number, employer, photos via external links) in chat.

**Current mitigations:**
- **Messages are never stored.** Doxxed information disappears when participants disconnect. There is no persistent record to scrape, screenshot (beyond the client-side window), or revisit.
- **No indexing or caching.** Shared PII does not enter any database, search index, or CDN cache.

**Residual risk:** During an active session, PII is visible to all room participants. Any participant can take a screenshot. The ephemeral design limits the *blast radius* of doxxing but does not prevent it in real time.

---

## 3. Privacy Analysis

### 3.1 Data Collected by VoltChat

| Category | Data Collected |
|---|---|
| Cookies | None |
| Sessions | None (no server-side sessions) |
| Analytics | None (no tracking scripts, no telemetry) |
| IP Logging | None (the application does not log IPs) |
| User Accounts | None |
| Message Content | Not stored — exists only in client-side React state |
| Usernames | Ephemeral, entered per-session, not stored |

**VoltChat itself collects zero data.**

### 3.2 Data Stored

None. There are no database tables, no object storage buckets, no log files written by the application. The Supabase project is used exclusively for its Realtime service (Broadcast and Presence), not for its database or storage features.

### 3.3 Third-Party Data Processing

While VoltChat collects nothing, it relies on third-party infrastructure that processes data in transit:

- **Supabase:** Processes WebSocket traffic for Realtime Broadcast and Presence. Supabase's infrastructure necessarily handles the content of messages as they pass through its servers for relay. Supabase's own data processing policies apply to this traffic.
- **Vercel:** Hosts the Next.js frontend. Vercel processes HTTP requests for serving static assets and may log request metadata (IP addresses, user agents, timestamps) per its standard infrastructure behavior.

### 3.4 Metadata Exposure

Even without application-level logging, metadata leaks are possible at the infrastructure layer:

- **Supabase connection logs:** Supabase may log WebSocket connection events, including timestamps, IP addresses, and channel names (which contain room IDs).
- **Vercel access logs:** Standard HTTP access logs may record page visits, including `/room/[roomId]` paths.
- **Network-level metadata:** ISPs and network intermediaries can observe that a user connected to Supabase/Vercel endpoints, though they cannot read the content of WSS-encrypted traffic.

### 3.5 Encryption

- **In transit:** All communication uses **WSS (WebSocket Secure) over TLS**. Messages are encrypted between the client and Supabase's servers.
- **At rest:** Not applicable — nothing is stored at rest.
- **End-to-end:** **No.** Messages are readable by Supabase's infrastructure as they pass through the relay. VoltChat does **not** implement end-to-end encryption. Supabase, as the relay operator, could theoretically inspect message content in transit. This is a significant limitation to acknowledge.

---

## 4. Anonymity vs. Accountability Trade-offs

### The Spectrum

Full anonymity and full accountability are opposite ends of a spectrum. Every communication platform makes a choice about where to sit on that spectrum:

| Platform | Anonymity | Accountability |
|---|---|---|
| Facebook Messenger | Low (real-name policy) | High (tied to identity) |
| Discord | Medium (pseudonymous) | Medium (account required) |
| Signal | Medium (phone number required) | Medium (number-linked) |
| **VoltChat** | **High (no identity at all)** | **Low (room-level only)** |
| Tor-based chat | Very High | Very Low |

### Who Benefits from High Anonymity

- **Whistleblowers** who need to share information without fear of retaliation.
- **Marginalized communities** in regions where certain identities or beliefs are criminalized.
- **People in abusive situations** who need to communicate without their abuser monitoring their accounts.
- **Journalists and sources** who need a low-friction, no-trace communication channel.
- **Anyone** who simply values conversational privacy and objects to the pervasive logging of modern communication platforms.

### Who Exploits High Anonymity

- Harassers and trolls who face no consequences for abusive behavior.
- Actors coordinating harm who want to avoid forensic trails.
- Individuals sharing illegal content who rely on the absence of logging.

### VoltChat's Position

VoltChat deliberately leans toward the privacy end of the spectrum. The design philosophy is that **the default state of a conversation should be impermanence** — matching the behavior of in-person speech, which is also ephemeral and unrecorded.

The accountability mechanism is **room-level creator moderation**:

- The room creator can kick and mute users.
- The room creator is the only authority within a room.
- There is **no global moderation** — no admin panel, no centralized moderation team, no content review.

This means the quality and safety of a room depends entirely on its creator. If a creator is absent, negligent, or malicious, there is no higher authority to appeal to. This is a deliberate design constraint, but it is also a real limitation.

---

## 5. Legal Considerations

### 5.1 GDPR (General Data Protection Regulation)

VoltChat's zero-data design largely sidesteps GDPR obligations:

- **No personal data is collected or stored** by the application, so there is no data to protect, rectify, or erase.
- **No data processing records** are required because no processing occurs at the application level.
- **Right to erasure** is satisfied by default — there is nothing to erase.

**However:** Third-party processors (Supabase, Vercel) may collect metadata as noted in Section 3. If VoltChat is offered to EU users, a privacy policy should disclose these third-party relationships and their respective data practices, even if VoltChat itself collects nothing.

### 5.2 COPPA (Children's Online Privacy Protection Act)

COPPA applies to services that knowingly collect personal information from children under 13. VoltChat collects no personal information from any user, which reduces COPPA exposure. However:

- There is no age gate or verification.
- A reasonable argument exists that a general-purpose anonymous chat service should implement at least a nominal age check in its terms, even if the underlying data architecture does not require it.

### 5.3 Hosting Infrastructure Liability

Under Section 230 (US) and the EU Digital Services Act, platform operators have varying degrees of liability for user-generated content:

- VoltChat does not store content, which limits traditional "knowledge of infringing content" liability.
- However, operating a service that is **designed** to leave no trace could attract regulatory scrutiny, particularly if the service is implicated in illegal activity.
- The hosting provider (Vercel) and the realtime provider (Supabase) may face their own compliance obligations.

### 5.4 Terms of Service

VoltChat currently has **no Terms of Service or Acceptable Use Policy**. This is a gap. Even a zero-data service should clearly state:

- Prohibited uses (illegal activity, harassment, CSAM).
- The operator's right to terminate access.
- Disclaimer of liability for user-generated content.
- Acknowledgment of third-party service providers.

### 5.5 DMCA

The DMCA (Digital Millennium Copyright Act) is **not directly applicable** — VoltChat does not host, store, or cache any copyrighted content. There is nothing to issue a takedown notice against.

---

## 6. Recommended Mitigations for Production

The following are recommended measures if VoltChat moves beyond a personal/experimental project to a production service. These are ordered roughly by implementation difficulty and impact.

### 6.1 Content Filtering (Opt-in Profanity Filter)

- Implement a **client-side** word filter that room creators can enable for their room.
- Use an open-source profanity list (e.g., `bad-words` npm package) with support for multiple languages.
- Keep this **opt-in** to respect the privacy-first philosophy. Do not filter by default.
- Important: Client-side filtering can be bypassed. This is a UX courtesy, not a security mechanism.

### 6.2 Report Mechanism

- Add a "Report Room" button that sends a webhook notification (e.g., to a Discord or Slack channel) with:
  - The room ID.
  - A timestamp.
  - The reporter's self-selected username.
  - **No message content.** This preserves the zero-data principle while enabling a minimal abuse signal.
- This allows operators to manually terminate a room if warranted.

### 6.3 Rate Limiting

- Implement **server-side rate limiting** (via Vercel Edge Middleware or Supabase Edge Functions) to prevent:
  - Message flooding (spam).
  - Rapid room creation (bot abuse).
  - Connection storms (DDoS).
- Suggested limits: 1 message per second per user, 10 room creations per IP per hour.

### 6.4 Room TTL (Time-to-Live)

- Automatically close rooms after a configurable maximum duration (e.g., 24 hours).
- Prevents rooms from being used as semi-persistent channels if participants keep connections alive indefinitely.
- Display a countdown or warning to participants before expiry.

### 6.5 Abuse Pattern Detection

- Monitor room creation patterns at the infrastructure level (not message content):
  - Sudden spikes in room creation from a single IP range.
  - Rooms with unusually high participant churn (possible harassment pattern).
  - Rooms that consistently hit capacity limits immediately after creation (possible bot coordination).
- This can be done at the Vercel/Supabase infrastructure level without inspecting message content.

### 6.6 Terms of Service & Acceptable Use Policy

- Draft and publish a Terms of Service and Acceptable Use Policy before any public launch.
- Clearly prohibit: illegal activity, harassment, threats, CSAM, and coordinated harm.
- Include a provision allowing the operator to terminate rooms or block access without prior notice.
- Acknowledge the zero-data architecture and its implications for both privacy and accountability.

---

## 7. Comparison with Similar Services

### 7.1 Omegle (Shut down November 2023)

| Aspect | Omegle | VoltChat |
|---|---|---|
| Pairing model | Random 1-on-1 stranger matching | Room-based, invite-only or public |
| Anonymity | Full | Full |
| Moderation | Minimal (AI filter added late) | Creator-level kick/mute |
| Content type | Video, text | Text only |
| Persistence | None | None |
| Outcome | **Shut down** citing inability to moderate | Active (project-scale) |

**Lessons from Omegle:** Omegle's random-pairing model was its core liability. It placed strangers — including minors — into direct 1-on-1 video sessions with no meaningful moderation layer. The founder's shutdown letter acknowledged that the platform could not be made safe enough to justify continued operation.

VoltChat's **room-based model** is a meaningful structural difference. Users join rooms intentionally (via shared room ID or public room list), not via random pairing. This means:
- Participants generally have context about why they are in a room.
- Room creators have moderation authority.
- There is no mechanism that forces two strangers into a private conversation.

This does not eliminate risk, but it changes the threat surface meaningfully compared to random-pairing services.

### 7.2 Whisper

Whisper marketed itself as anonymous but was found to be tracking user locations and retaining data. Its lesson: **claiming anonymity while collecting data is worse than not claiming it at all.** VoltChat's architecture genuinely collects nothing at the application level, which is a more honest posture — but the third-party metadata exposure (Section 3.4) should be disclosed transparently.

### 7.3 YikYak

YikYak was an anonymous, location-based social app popular on college campuses. It was shut down in 2017 after persistent issues with cyberbullying, threats, and hate speech. It relaunched in 2021 with phone number verification.

**Lesson:** Pure anonymity at a community scale (location-based discovery = many strangers interacting) without robust moderation leads to toxic environments. VoltChat's smaller room-based model limits the "community scale" problem but does not eliminate it for public rooms.

### 7.4 Signal (Disappearing Messages)

Signal offers disappearing messages as an opt-in feature on top of a persistent, end-to-end encrypted messaging platform. Key differences from VoltChat:

- Signal requires a phone number (pseudonymous, not anonymous).
- Signal provides **end-to-end encryption** — the server cannot read messages. VoltChat does not.
- Signal's disappearing messages are a feature; VoltChat's ephemerality is the entire architecture.

### 7.5 Telegram (Secret Chats)

Telegram's secret chats offer end-to-end encryption and optional self-destruct timers. Standard Telegram chats are server-stored and not end-to-end encrypted. VoltChat's positioning is closer to Telegram's secret chats in philosophy but without the E2E encryption — a notable gap.

### 7.6 Summary

VoltChat occupies a specific niche: **text-only, room-based, zero-persistence, no-identity chat with creator moderation.** It avoids the worst architectural mistakes of its predecessors (random pairing, false anonymity claims, community-scale anonymous broadcast) but shares the fundamental challenge of all anonymous services: accountability depends on social norms and room-level moderation rather than system-level enforcement.

---

## 8. Conclusion

VoltChat is designed around a clear value proposition: **conversations should be able to exist without leaving a trace.** This is a legitimate privacy goal that serves real users with real needs.

The current design makes responsible trade-offs:

- **Privacy is prioritized** through zero data collection, no accounts, no persistence.
- **Safety is addressed** through creator-level moderation (kick, mute), room capacity limits, text-only communication, and room-based (not random-pairing) architecture.
- **Transparency is maintained** by acknowledging that third-party infrastructure (Supabase, Vercel) processes data in transit and may retain metadata.

However, this document must be honest about what VoltChat **cannot** guarantee:

- **No system is abuse-proof.** Anonymous, ephemeral communication can and will be misused by some fraction of users.
- **Room-level moderation is only as good as the room creator.** There is no fallback authority.
- **The lack of end-to-end encryption** means Supabase can theoretically inspect messages in transit. Users who need protection from infrastructure-level surveillance should use E2E-encrypted tools instead.
- **No forensic capability exists.** If illegal activity occurs on VoltChat, there is no log to subpoena, no message to retrieve, no user to identify through the application. This is by design, but it has consequences.

### Future Considerations

The following features could be added to strengthen safety without compromising the zero-data core:

- **Opt-in content filtering** (client-side, creator-enabled).
- **Lightweight report webhook** (room ID + timestamp only, no message content).
- **Server-side rate limiting** to prevent automated abuse.
- **Room TTL** to prevent indefinite room lifetimes.
- **Optional end-to-end encryption** for users who need it (significant engineering effort).
- **Terms of Service and Acceptable Use Policy** (minimal effort, high importance).

VoltChat does not pretend to solve the fundamental tension between privacy and accountability. It makes a deliberate choice — favoring privacy — and provides the tools it can (creator moderation) to manage the consequences of that choice. The responsible path forward is continued transparency about these trade-offs and incremental adoption of safety features as the project evolves.
