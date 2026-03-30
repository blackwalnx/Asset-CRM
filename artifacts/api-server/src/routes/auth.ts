import crypto from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import {
  clearSession,
  getSessionId,
  createSession,
  SESSION_COOKIE,
  SESSION_TTL,
  getGoogleOAuthUrl,
  exchangeGoogleCode,
  getGoogleUserInfo,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function getSafeReturnTo(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/";
  }
  return value;
}

async function upsertUser(profile: Record<string, unknown>) {
  const userData = {
    id: profile.sub as string,
    email: (profile.email as string) || null,
    firstName: (profile.given_name as string) || null,
    lastName: (profile.family_name as string) || null,
    profileImageUrl: (profile.picture as string) || null,
  };

  const [user] = await db
    .insert(usersTable)
    .values(userData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        ...userData,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.get("/login", (req: Request, res: Response) => {
  const callbackUrl = `${getOrigin(req)}/api/callback`;
  const returnTo = getSafeReturnTo(req.query.returnTo);

  const state = crypto.randomBytes(16).toString("hex");

  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60 * 1000,
  });
  res.cookie("return_to", returnTo, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60 * 1000,
  });

  const url = getGoogleOAuthUrl(callbackUrl, state);
  console.log("[Google OAuth] Redirecting with callback URL:", callbackUrl);
  res.redirect(url);
});

router.get("/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    res.redirect("/login?error=access_denied");
    return;
  }

  const expectedState = req.cookies?.oauth_state;
  if (!code || !state || !expectedState || state !== expectedState) {
    res.redirect("/login?error=invalid_state");
    return;
  }

  const returnTo = getSafeReturnTo(req.cookies?.return_to);

  res.clearCookie("oauth_state", { path: "/" });
  res.clearCookie("return_to", { path: "/" });

  try {
    const callbackUrl = `${getOrigin(req)}/api/callback`;
    const { accessToken, refreshToken } = await exchangeGoogleCode(
      code as string,
      callbackUrl,
    );

    const userInfo = await getGoogleUserInfo(accessToken);

    const dbUser = await upsertUser(userInfo);

    const sessionData: SessionData = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);
    res.redirect(returnTo);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    res.redirect("/login?error=auth_failed");
  }
});

router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect("/login");
});

export default router;
