# VoltChat — Terms of Service & Acceptable Use Policy

**Effective Date:** March 5, 2026

---

## 1. What VoltChat Is

VoltChat is an anonymous, ephemeral real-time chat application. There are no user accounts, no message history, and no stored data. All messages are relayed in real time through Supabase Realtime and exist only in participants' browsers while they are connected. Once you leave a room, the conversation is gone forever and cannot be recovered by anyone — including the operator.

---

## 2. Acceptance of Terms

By accessing or using VoltChat, you agree to be bound by these Terms of Service and Acceptable Use Policy. If you do not agree with any part of these terms, you must stop using VoltChat immediately.

---

## 3. Prohibited Uses

You may not use VoltChat for any of the following purposes. Violations may result in immediate termination of access at the operator's sole discretion.

- **Illegal activity** — Any use that violates applicable local, national, or international law.
- **Harassment and abuse** — Bullying, threats, intimidation, targeted harassment, or any conduct intended to harm or distress others.
- **Child Sexual Abuse Material (CSAM)** — Absolutely zero tolerance. Any sharing, solicitation, or distribution of CSAM or exploitation of minors in any form.
- **Coordinating violence or harm** — Planning, inciting, or organizing acts of violence, terrorism, self-harm, or any activity intended to cause physical harm to others.
- **Doxxing** — Sharing another person's private or personally identifiable information without their explicit consent.
- **Spam and bot abuse** — Automated messaging, flooding, bot-driven activity, or any form of unsolicited bulk communication.
- **Infrastructure attacks** — Attempting to exploit, compromise, disrupt, or reverse-engineer the VoltChat service, its hosting infrastructure, or any connected third-party services.

---

## 4. Privacy & Data

- **No accounts, no personal data collected.** VoltChat does not require registration, does not collect email addresses, and does not store usernames beyond your active session.
- **Messages are never stored.** All messages exist only in real time during an active session. Once delivered, messages are not saved to any database and cannot be recovered by VoltChat or its operator.
- **Optional end-to-end encryption.** Private rooms support optional E2EE using AES-GCM 256-bit encryption via the Web Crypto API. When enabled, the encryption key is shared solely through the URL fragment (hash), which is never sent to the server. Only users with the full room link can decrypt messages. When E2EE is not enabled, messages pass through Supabase servers with standard transport encryption (TLS/HTTPS) only.
- **Third-party logging.** Supabase (message relay) and Vercel (hosting) may log connection metadata such as IP addresses and timestamps in accordance with their own privacy policies. VoltChat's operator does not control or have access to these logs.
- **No content retrieval or review.** VoltChat has no ability to retrieve, review, or moderate message content after delivery. Once a message leaves the relay, it exists only in connected clients' browser memory.

---

## 5. Room Moderation

- Room creators have the ability to **kick** and **mute** other users within their room.
- **Creator succession:** If the room creator leaves, moderation powers automatically transfer to the longest-connected remaining user.
- **Vote kick:** Non-creator users can initiate a vote to kick other non-creator users. A majority vote (50% of eligible voters, excluding the creator and the target) is required to kick a user. Votes expire after 30 seconds.
- **AFK auto-kick:** Users who are inactive for 15 minutes are automatically removed from the room. A 5-minute inactivity warning is displayed before removal.
- **User silence:** Users can locally hide messages from specific other users. This is a client-side-only feature — it does not affect what other users see and is not persisted.
- **Read receipts:** When you read messages in a room, other participants can see that you have read them via small avatar indicators. This information is broadcast in real time and is not stored.
- **Report system:** Users can report rooms for harassment, illegal content, spam, or other violations. Reports include only the room ID and selected reason — no message content is ever transmitted. Rooms that receive 5 or more reports may be automatically terminated.
- **There is no global moderation team.** VoltChat does not employ moderators and does not actively monitor any rooms or message content.
- Users are responsible for managing their own experience. If you encounter abusive behavior, you may leave the room at any time.

---

## 6. Age Requirement

- VoltChat is intended for users **13 years of age or older**.
- No age verification mechanism is implemented. By using VoltChat, you self-certify that you meet this age requirement.
- If you are under 13 years of age, you must not use VoltChat.

---

## 7. Operator Rights

- The operator reserves the right to **terminate rooms, block access, or shut down the service entirely** at any time, for any reason, without prior notice.
- There is **no guarantee of availability, uptime, or service continuity**. VoltChat may be modified, suspended, or discontinued at any time.

---

## 8. Disclaimer of Liability

- VoltChat is provided **"as is"** and **"as available"** without warranties of any kind, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
- **The operator is not responsible for user-generated content.** All messages and interactions within VoltChat are solely the responsibility of the users who create them.
- **The operator is not liable for any damages** — direct, indirect, incidental, consequential, or otherwise — arising from your use of or inability to use VoltChat.
- **You use VoltChat at your own risk.** You acknowledge that anonymous, unmoderated communication carries inherent risks.

---

## 9. Third-Party Services

VoltChat relies on the following third-party services:

- **Supabase** — Real-time message relay. Subject to the [Supabase Terms of Service](https://supabase.com/terms) and [Privacy Policy](https://supabase.com/privacy).
- **Vercel** — Application hosting. Subject to the [Vercel Terms of Service](https://vercel.com/legal/terms) and [Privacy Policy](https://vercel.com/legal/privacy-policy).

By using VoltChat, you acknowledge that your usage is also subject to the terms and policies of these providers.

---

## 10. Changes to Terms

These terms may be updated at any time without prior notice. The effective date at the top of this document will reflect the most recent revision. Continued use of VoltChat after any changes constitutes your acceptance of the updated terms.

---

## 11. Contact

For questions, concerns, or reports related to these terms or the VoltChat service, please reach out via the GitHub repository:

**https://github.com/nbfrodri**

---

*VoltChat is an independent, open-source project. It is not affiliated with Supabase, Vercel, or any other third party.*
