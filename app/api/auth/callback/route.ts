import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { seedDefaultRules } from "@/services/default-rules";

function getAppUrl(req: NextRequest): string {
  // 1. Try Referer origin
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const origin = new URL(referer).origin;
      if (origin && !origin.includes("github.com")) {
        return origin;
      }
    } catch {}
  }
  // 2. Try proxy forwarding headers
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "http";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  // 3. Try env config
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // 4. Default fallback (forcing http for localhost to avoid SSL errors)
  const origin = req.nextUrl.origin;
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return origin.replace(/^https:/, "http:");
  }
  return origin;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const appUrl = getAppUrl(req);

  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", appUrl));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  try {
    // 1. Exchange code for Access Token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to exchange OAuth code: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("GitHub did not return an access token: " + JSON.stringify(tokenData));
    }

    // 2. Fetch User Profile from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": "Github-automation-bot",
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user profile from GitHub");
    }

    const githubUser = await userResponse.json();
    const githubId = githubUser.id;
    const username = githubUser.login;
    const avatarUrl = githubUser.avatar_url;

    // 3. Upsert User in database (save access token)
    const dbUser = await prisma.user.upsert({
      where: { githubId },
      update: {
        username,
        avatarUrl,
        accessToken,
      },
      create: {
        githubId,
        username,
        avatarUrl,
        accessToken,
      },
    });

    // 4. Seed default automation rules for new users
    await seedDefaultRules(dbUser.id);

    // 5. Set Session Cookie
    await setSessionCookie({
      userId: dbUser.id,
      githubId,
      username,
    });

    // 5. Redirect to Dashboard
    return NextResponse.redirect(new URL("/dashboard", appUrl));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/?error=auth_failed", appUrl));
  }
}
