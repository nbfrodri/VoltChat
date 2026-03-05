import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const type = request.nextUrl.searchParams.get("type") || "message";

  if (type === "room") {
    // 5 rooms per minute per IP
    const result = rateLimit(`room:${ip}`, 5, 60 * 1000);
    return NextResponse.json({
      allowed: result.allowed,
      remaining: result.remaining,
      retryAfter: result.retryAfter,
    });
  }

  // Default: message rate check — 30 messages per 10 seconds
  const result = rateLimit(`msg:${ip}`, 30, 10 * 1000);
  return NextResponse.json({
    allowed: result.allowed,
    remaining: result.remaining,
    retryAfter: result.retryAfter,
  });
}
