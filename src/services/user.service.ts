import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";

export function listUsers() {
  return prisma.user.findMany({ orderBy: { name: "asc" } });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User not found");
  return user;
}