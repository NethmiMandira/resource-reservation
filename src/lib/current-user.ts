import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "@/lib/errors";

export const USER_COOKIE = "userId";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getCurrentUser() {
  const id = (await cookies()).get(USER_COOKIE)?.value;
  if (!id || !UUID_RE.test(id)) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}