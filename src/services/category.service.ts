import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { CreateCategoryInput } from "@/validators/category.schema";

export function listCategories() {
  return prisma.resourceCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { resources: true } } },
  });
}

export function createCategory(input: CreateCategoryInput) {
  return prisma.resourceCategory.create({ data: input });
}

export async function updateCategory(id: string, input: Partial<CreateCategoryInput>) {
  await getCategoryOrThrow(id);
  return prisma.resourceCategory.update({ where: { id }, data: input });
}

// Fails with a 409 (via handleError) if resources still use this category
export async function deleteCategory(id: string) {
  await getCategoryOrThrow(id);
  return prisma.resourceCategory.delete({ where: { id } });
}

async function getCategoryOrThrow(id: string) {
  const category = await prisma.resourceCategory.findUnique({ where: { id } });
  if (!category) throw new NotFoundError("Category not found");
  return category;
}