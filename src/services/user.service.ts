import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { CreateUserInput } from "@/validators/user.schema";

export function listUsers() {
  return prisma.user.findMany({ orderBy: { name: "asc" } });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

// The email is unique: a duplicate becomes a 409 through handleError
export function createUser(input: CreateUserInput) {
  return prisma.user.create({ data: input });
}