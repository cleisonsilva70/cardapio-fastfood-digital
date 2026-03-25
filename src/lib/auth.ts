import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ownerSessionCookieName = "fastfood-owner-session";
const ownerSessionTtlSeconds = 60 * 60 * 12;

function getOwnerPassword() {
  return process.env.OWNER_ACCESS_PASSWORD ?? "";
}

function getAcceptedOwnerPasswords() {
  return getOwnerPassword()
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getSessionSecret() {
  return process.env.OWNER_SESSION_SECRET || "owner-session-development-secret";
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function isOwnerAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ownerSessionCookieName)?.value;

  if (!session) {
    return false;
  }

  const [scope, expiresAt, signature] = session.split(".");

  if (!scope || !expiresAt || !signature) {
    return false;
  }

  if (scope !== "owner") {
    return false;
  }

  if (Number(expiresAt) <= Date.now()) {
    return false;
  }

  return safeEqual(signature, signValue(`${scope}.${expiresAt}`));
}

export function validateOwnerPassword(password: string) {
  const normalizedPassword = password.trim();

  return getAcceptedOwnerPasswords().some((acceptedPassword) =>
    safeEqual(normalizedPassword, acceptedPassword),
  );
}

export function getOwnerSessionToken() {
  const expiresAt = Date.now() + ownerSessionTtlSeconds * 1000;
  const payload = `owner.${expiresAt}`;
  const signature = signValue(payload);
  return `${payload}.${signature}`;
}
