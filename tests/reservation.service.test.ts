import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ConflictError, ForbiddenError } from "@/lib/errors";
import {
  cancelReservation,
  createReservation,
  getAvailability,
} from "@/services/reservation.service";

// All test data uses a random suffix and is removed afterwards,
// so the seeded demo data is never touched.
const tag = Math.random().toString(36).slice(2, 8);

// Far in the future, in Sri Lanka time, so the "no past bookings" rule never interferes
function at(hour: number, minute = 0) {
  const d = new Date("2030-06-15T00:00:00+05:30");
  d.setUTCHours(d.getUTCHours() + hour, d.getUTCMinutes() + minute);
  return d;
}

let resourceId: string;
let inactiveResourceId: string;
let admin: { id: string; role: Role };
let owner: { id: string; role: Role };
let other: { id: string; role: Role };

beforeAll(async () => {
  const category = await prisma.resourceCategory.create({
    data: { name: `Test category ${tag}` },
  });
  const resource = await prisma.resource.create({
    data: { categoryId: category.id, name: `Test room ${tag}` },
  });
  const inactive = await prisma.resource.create({
    data: { categoryId: category.id, name: `Inactive ${tag}`, isActive: false },
  });
  resourceId = resource.id;
  inactiveResourceId = inactive.id;

  const make = (name: string, role: Role) =>
    prisma.user.create({
      data: { name, email: `${name.toLowerCase()}.${tag}@test.lk`, role },
    });
  admin = await make("Admin", Role.ADMIN);
  owner = await make("Owner", Role.MEMBER);
  other = await make("Other", Role.MEMBER);
});

afterAll(async () => {
  await prisma.reservation.deleteMany({
    where: { resource: { name: { contains: tag } } },
  });
  await prisma.resource.deleteMany({ where: { name: { contains: tag } } });
  await prisma.resourceCategory.deleteMany({ where: { name: { contains: tag } } });
  await prisma.user.deleteMany({ where: { email: { contains: tag } } });
  await prisma.$disconnect();
});

const book = (user: { id: string }, title: string, start: Date, end: Date, rid = resourceId) =>
  createReservation({ resourceId: rid, title, startTime: start, endTime: end }, user);

describe("reservation overlap rules", () => {
  it("creates a reservation", async () => {
    const r = await book(owner, "First", at(10), at(11));
    expect(r.status).toBe("CONFIRMED");
    expect(r.user.id).toBe(owner.id);
  });

  it("rejects an overlapping reservation with a ConflictError", async () => {
    await expect(book(other, "Clash", at(10, 30), at(11, 30))).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("rejects a reservation fully inside an existing one", async () => {
    await expect(book(other, "Inside", at(10, 15), at(10, 45))).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("allows back-to-back reservations (end == next start)", async () => {
    const r = await book(other, "Back to back", at(11), at(12));
    expect(r.status).toBe("CONFIRMED");
  });

  it("allows the same time on a different resource", async () => {
    const category = await prisma.resourceCategory.findFirstOrThrow({
      where: { name: { contains: tag } },
    });
    const second = await prisma.resource.create({
      data: { categoryId: category.id, name: `Second room ${tag}` },
    });
    const r = await book(owner, "Parallel", at(10), at(11), second.id);
    expect(r.status).toBe("CONFIRMED");
  });

  it("rejects bookings on an inactive resource", async () => {
    await expect(
      book(owner, "Nope", at(14), at(15), inactiveResourceId),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("cancelling", () => {
  it("lets the owner cancel, and the slot can then be booked again", async () => {
    const r = await book(owner, "To cancel", at(15), at(16));
    const cancelled = await cancelReservation(r.id, owner);
    expect(cancelled.status).toBe("CANCELLED");

    const again = await book(other, "Rebooked", at(15), at(16));
    expect(again.status).toBe("CONFIRMED");
  });

  it("does not let another member cancel it", async () => {
    const r = await book(owner, "Protected", at(17), at(18));
    await expect(cancelReservation(r.id, other)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("lets an admin cancel anyone's reservation", async () => {
    const r = await book(owner, "Admin cancels", at(19), at(20));
    const cancelled = await cancelReservation(r.id, admin);
    expect(cancelled.status).toBe("CANCELLED");
  });

  it("rejects cancelling twice", async () => {
    const r = await book(owner, "Twice", at(21), at(22));
    await cancelReservation(r.id, owner);
    await expect(cancelReservation(r.id, owner)).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("availability", () => {
  it("lists only confirmed reservations for the day", async () => {
    const { busy } = await getAvailability(resourceId, "2030-06-15");
    const titles = busy.map((b) => b.title);
    expect(titles).toContain("First");
    expect(titles).toContain("Rebooked");
    expect(titles).not.toContain("To cancel");
  });
});