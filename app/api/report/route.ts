import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const VALID_REASONS = ["harassment", "illegal", "spam", "other"] as const;
const TERMINATE_THRESHOLD = 5;

// Track report counts per room (in-memory, resets on deploy)
const roomReportCounts = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // Rate limit: 1 report per IP per 5 minutes
    const { allowed, retryAfter } = rateLimit(`report:${ip}`, 1, 5 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many reports. Try again later.", retryAfter },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { roomId, reason, details } = body as {
      roomId?: string;
      reason?: string;
      details?: string;
    };

    // Validate
    if (!roomId || typeof roomId !== "string" || roomId.length > 20) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }
    if (!reason || !VALID_REASONS.includes(reason as typeof VALID_REASONS[number])) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }
    const sanitizedDetails = typeof details === "string" ? details.slice(0, 200) : "";

    // Track report count for this room
    const currentCount = (roomReportCounts.get(roomId) || 0) + 1;
    roomReportCounts.set(roomId, currentCount);
    const shouldTerminate = currentCount >= TERMINATE_THRESHOLD;

    const report = {
      type: "voltchat_report",
      roomId,
      reason,
      details: sanitizedDetails,
      ip: ip.slice(0, 45),
      reportCount: currentCount,
      terminated: shouldTerminate,
      timestamp: new Date().toISOString(),
    };

    // Always log reports server-side
    console.log("[REPORT]", JSON.stringify(report));

    // Send webhook if configured (supports Discord/Slack-style webhooks)
    const webhookUrl = process.env.REPORT_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const isDiscord = webhookUrl.includes("discord.com/api/webhooks");
        const payload = isDiscord
          ? {
              embeds: [{
                title: shouldTerminate ? "Room Terminated" : "VoltChat Report",
                color: shouldTerminate ? 0xff0000 : 0xff4444,
                fields: [
                  { name: "Room", value: roomId, inline: true },
                  { name: "Reason", value: reason, inline: true },
                  { name: "Reports", value: `${currentCount}/${TERMINATE_THRESHOLD}`, inline: true },
                  ...(sanitizedDetails ? [{ name: "Details", value: sanitizedDetails }] : []),
                ],
                timestamp: report.timestamp,
              }],
            }
          : report;

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // Webhook failure is non-fatal
      }
    }

    return NextResponse.json({
      success: true,
      terminated: shouldTerminate,
      reportCount: currentCount,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
