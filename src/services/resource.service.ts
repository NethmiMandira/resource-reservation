import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type {
  CreateResourceInput,
  UpdateResourceInput,
} from "@/validators/resource.schema";

type Filters = { categoryId?: string; active?: "true" | "false" };

export function listResources(filters: Filters = {}, order: "name" | "newest" = "name") {
  const orderBy: Prisma.ResourceOrderByWithRelationInput[] =
    order === "newest"
      ? [{ createdAt: "desc" }, { name: "asc" }]
      : [{ category: { name: "asc" } }, { name: "asc" }];

  return prisma.resource.findMany({
    where: {
      categoryId: filters.categoryId,
      isActive: filters.active === undefined ? undefined : filters.active === "true",
    },
    include: { category: true, _count: { select: { reservations: true } } },
    orderBy,
  });
}

export async function getResourceById(id: string) {
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!resource) throw new NotFoundError("Resource not found");
  return resource;
}

export async function createResource(input: CreateResourceInput) {
  const category = await prisma.resourceCategory.findUnique({
    where: { id: input.categoryId },
  });
  if (!category) throw new NotFoundError("Category not found");
  return prisma.resource.create({ data: input, include: { category: true } });
}

export async function updateResource(id: string, input: UpdateResourceInput) {
  await getResourceById(id);
  return prisma.resource.update({
    where: { id },
    data: input,
    include: { category: true },
  });
}

// Resources that already have reservations are marked unavailable instead of
// deleted, so the booking history is never lost
export async function deleteResource(id: string) {
  await getResourceById(id);
  const count = await prisma.reservation.count({ where: { resourceId: id } });
  if (count > 0) {
    const resource = await prisma.resource.update({
      where: { id },
      data: { isActive: false },
    });
    return { deleted: false as const, resource };
  }
  const resource = await prisma.resource.delete({ where: { id } });
  return { deleted: true as const, resource };
}