import "dotenv/config";
import { PrismaClient, Role, ReservationStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Today + N days, at the given hour (local time)
function at(daysFromNow: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  // Clear in dependency order so the seed can be re-run safely
  await prisma.reservation.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.resourceCategory.deleteMany();
  await prisma.user.deleteMany();

  const [sunil, nimal, kamala] = await Promise.all([
    prisma.user.create({
      data: { name: "Sunil Perera", email: "sunil@company.lk", role: Role.ADMIN },
    }),
    prisma.user.create({
      data: { name: "Nimal Silva", email: "nimal@company.lk", role: Role.MEMBER },
    }),
    prisma.user.create({
      data: { name: "Kamala Fernando", email: "kamala@company.lk", role: Role.MEMBER },
    }),
  ]);

  const rooms = await prisma.resourceCategory.create({
    data: { name: "Meeting Rooms", description: "Rooms for meetings and calls" },
  });
  const vehicles = await prisma.resourceCategory.create({
    data: { name: "Vehicles", description: "Company vehicles" },
  });
  const equipment = await prisma.resourceCategory.create({
    data: { name: "Equipment", description: "Shared equipment" },
  });

  const boardRoom = await prisma.resource.create({
    data: { categoryId: rooms.id, name: "Board Room A", location: "Floor 2", capacity: 12 },
  });
  await prisma.resource.create({
    data: { categoryId: rooms.id, name: "Meeting Room B", location: "Floor 1", capacity: 6 },
  });
  const van = await prisma.resource.create({
    data: { categoryId: vehicles.id, name: "Toyota Hiace Van", location: "Parking", capacity: 9 },
  });
  await prisma.resource.create({
    data: { categoryId: equipment.id, name: "Projector P1", location: "Store", capacity: 1 },
  });
  await prisma.resource.create({
    data: {
      categoryId: equipment.id,
      name: "Projector P2 (under repair)",
      location: "Store",
      capacity: 1,
      isActive: false,
    },
  });

  await prisma.reservation.createMany({
    data: [
      {
        resourceId: boardRoom.id,
        userId: nimal.id,
        title: "Sprint planning",
        startTime: at(1, 10),
        endTime: at(1, 11),
      },
      {
        // back-to-back with the one above: allowed
        resourceId: boardRoom.id,
        userId: kamala.id,
        title: "Client call",
        startTime: at(1, 11),
        endTime: at(1, 12),
      },
      {
        resourceId: van.id,
        userId: kamala.id,
        title: "Site visit",
        startTime: at(2, 8),
        endTime: at(2, 17),
      },
      {
        // cancelled: does not block the slot
        resourceId: boardRoom.id,
        userId: nimal.id,
        title: "Old meeting",
        startTime: at(1, 14),
        endTime: at(1, 15),
        status: ReservationStatus.CANCELLED,
      },
    ],
  });

  console.log("Seed complete:", { admin: sunil.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());