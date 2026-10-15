import { notFound } from "next/navigation";
import { z } from "zod";
import CategoryForm from "@/components/categories/CategoryForm";
import { getCurrentUser } from "@/lib/current-user";
import { NotFoundError } from "@/lib/errors";
import { isAdmin } from "@/lib/permissions";
import { getCategoryById } from "@/services/category.service";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Edit category</h1>
        <p className="text-slate-500">
          Only admins can edit categories. Use the &ldquo;Acting as&rdquo; menu to switch to an
          admin.
        </p>
      </div>
    );
  }

  let category;
  try {
    category = await getCategoryById(id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit category</h1>
      <CategoryForm
        initial={{
          id: category.id,
          name: category.name,
          description: category.description,
        }}
      />
    </div>
  );
}