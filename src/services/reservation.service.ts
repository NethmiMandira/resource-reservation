import { Prisma, ReservationStatus, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { canCancel } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";
import type {
  CreateReservationInput,
  ReservationFilters,
} from "@/validators/reservation.schema";

const include = {
  resource: { include: { category: true } },
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ReservationInclude;

// The no_overlap exclusion constraint is the source of truth for conflicts.
// Prisma does not map it to a known error code, so we recognise it by name.
function isOverlapError(err: unknown) {
  return err instanceof Error && /no_overlap|exclusion constraint/i.test(err.message);
}

export async function createReservation(
  input: CreateReservationInput,
  user: Pick<User, "id">,
) {
  const resource = await prisma.resource.findUnique({
    where: { id: input.resourceId },
  });
  if (!resource) throw new NotFoundError("Resource not found");
  if (!resource.isActive) {
    throw new ConflictError("This resource is not available for booking");
  }

  try {
    return await prisma.reservation.create({
      data: {
        resourceId: input.resourceId,
        userId: user.id,
        title: input.title,
        startTime: input.startTime,
        endTime: input.endTime,
      },
      include,
    });
  } catch (err) {
    if (!isOverlapError(err)) throw err;

    // Look up the clashing booking only to give the user a helpful message
    const clash = await prisma.reservation.findFirst({
      where: {
        resourceId: input.resourceId,
        status: ReservationStatus.CONFIRMED,
        startTime: { lt: input.endTime },
        endTime: { gt: input.startTime },
      },
      include: { user: { select: { name: true } } },
    });

    throw new ConflictError(
      clash
        ? `${resource.name} is already booked from ${formatDateTime(clash.startTime)} to ${formatDateTime(clash.endTime)} by ${clash.user.name}`
        : `${resource.name} is already booked for that time`,
    );
  }
}

export function listReservations(filters: ReservationFilters = {}) {
  return prisma.reservation.findMany({
    where: {
      resourceId: filters.resourceId,
      userId: filters.userId,
      status: filters.status,
      ...(filters.from && { endTime: { gt: filters.from } }),
      ...(filters.to && { startTime: { lt: filters.to } }),
    },
    include,
    orderBy: { startTime: "asc" },
  });
}

export async function getReservationById(id: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include,
  });
  if (!reservation) throw new NotFoundError("Reservation not found");
  return reservation;
}

// Cancelling keeps the row (history) and frees the slot, because the
// exclusion constraint only applies to CONFIRMED reservations.
export async function cancelReservation(id: string, user: Pick<User, "id" | "role">) {
  const reservation = await getReservationById(id);

  if (!canCancel(user, reservation)) {
    throw new ForbiddenError("You can only cancel your own reservations");
  }
  if (reservation.status === ReservationStatus.CANCELLED) {
    throw new ConflictError("This reservation is already cancelled");
  }

  return prisma.reservation.update({
    where: { id },
    data: { status: ReservationStatus.CANCELLED },
    include,
  });
}

// Sri Lanka has no daylight saving, so a fixed +05:30 offset is safe here
export async function getAvailability(resourceId: string, date: string) {
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) throw new NotFoundError("Resource not found");

  const dayStart = new Date(`${date}T00:00:00+05:30`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const busy = await prisma.reservation.findMany({
    where: {
      resourceId,
      status: ReservationStatus.CONFIRMED,
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      user: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return { resourceId, date, isActive: resource.isActive, busy };
}