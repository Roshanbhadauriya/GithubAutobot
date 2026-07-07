import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

function getAppUrl(req: NextRequest): string {
  // 1. Try to extract origin from the browser's Referer header (highly dynamic & reliable for tunnels)
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const origin = new URL(referer).origin;
      if (origin && !origin.includes("github.com")) {
        return origin;
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  // 2. Try proxy forwarding headers
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "http";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // 3. Try environment configuration
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 4. Default fallback (ensure localhost never redirects to https)
  const origin = req.nextUrl.origin;
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return origin.replace(/^https:/, "http:");
  }

  return origin;
}

export async function GET(req: NextRequest) {
  await clearSessionCookie();
  const appUrl = getAppUrl(req);
  return NextResponse.redirect(new URL("/", appUrl));
}
