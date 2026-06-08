import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getPlayerById } from "./queries";

const COOKIE = "wc_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-insecure-secret-change-me"
);

export type SessionPlayer = {
  id: string;
  name: string;
  is_admin: boolean;
};

export async function createSession(player: SessionPlayer) {
  const token = await new SignJWT({ name: player.name, is_admin: player.is_admin })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(player.id)
    .setIssuedAt()
    .setExpirationTime("60d")
    .sign(secret);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCurrentPlayer(): Promise<SessionPlayer | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: String(payload.sub),
      name: String(payload.name),
      is_admin: Boolean(payload.is_admin),
    };
  } catch {
    return null;
  }
}

export async function requirePlayer(): Promise<SessionPlayer> {
  const p = await getCurrentPlayer();
  if (!p) throw new Error("UNAUTHENTICATED");
  return p;
}

export async function requireAdmin(): Promise<SessionPlayer> {
  const p = await requirePlayer();
  // Re-check against DB.
  const player = await getPlayerById(p.id);
  if (!player?.is_admin) throw new Error("FORBIDDEN");
  return p;
}
