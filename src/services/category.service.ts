import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { CreateCategoryInput } from "@/validators/category.schema";

export function listCategories() {
  return prisma.resourceCategory.findMany({
    orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    include: { _count: { select: { resources: true } } },
  });
}

export async function getCategoryById(id: string) {
  const category = await prisma.resourceCategory.findUnique({ where: { id } });
  if (!category) throw new NotFoundError("Category not found");
  return category;
}

export function createCategory(input: CreateCategoryInput) {
  return prisma.resourceCategory.create({ data: input });
}

export async function updateCategory(id: string, input: Partial<CreateCategoryInput>) {
  await getCategoryById(id);
  return prisma.resourceCategory.update({ where: { id }, data: input });
}

// A category that still has resources cannot be deleted
export async function deleteCategory(id: string) {
  await getCategoryById(id);
  const resources = await prisma.resource.count({ where: { categoryId: id } });
  if (resources > 0) {
    throw new ConflictError(
      `This category still has ${resources} resource${resources === 1 ? "" : "s"}. Move or delete them first.`,
    );
  }
  return prisma.resourceCategory.delete({ where: { id } });
}