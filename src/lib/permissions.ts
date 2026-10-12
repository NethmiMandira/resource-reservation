import type { Reservation, User } from "@prisma/client";
import { ForbiddenError } from "@/lib/errors";

export function isAdmin(user: Pick<User, "role">) {
  return user.role === "ADMIN";
}

export function assertAdmin(user: Pick<User, "role">) {
  if (!isAdmin(user)) throw new ForbiddenError("Only admins can do this");
}

export function canCancel(
  user: Pick<User, "id" | "role">,
  reservation: Pick<Reservation, "userId">,
) {
  return isAdmin(user) || reservation.userId === user.id;
}