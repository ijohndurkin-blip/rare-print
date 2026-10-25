import "server-only";
import { cookies } from "next/headers";
import { sign, verify } from "./storage";

const COOKIE = "rp_admin";
const MAX_AGE = 60 * 60 * 24 * 14;

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export async function isAdmin() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value || !adminConfigured()) return false;
  const [expires, sig] = value.split(".");
  if (!expires || Number(expires) < Date.now()) return false;
  return verify(`admin:${expires}`, sig);
}

export async function startAdminSession() {
  const expires = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${expires}.${sign(`admin:${expires}`)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}
