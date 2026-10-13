import { notFound } from "next/navigation";
import { z } from "zod";
import { NotFoundError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/current-user";
import { isAdmin } from "@/lib/permissions";
import { listCategories } from "@/services/category.service";
import { getResourceById } from "@/services/resource.service";
import ResourceForm from "@/components/resources/ResourceForm";

export default async function EditResourcePage({
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
        <h1 className="text-2xl font-semibold">Edit resource</h1>
        <p className="text-slate-500">
          Only admins can edit resources. Use the &ldquo;Acting as&rdquo; menu to switch to an
          admin.
        </p>
      </div>
    );
  }

  let resource;
  try {
    resource = await getResourceById(id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit resource</h1>
      <ResourceForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          id: resource.id,
          categoryId: resource.categoryId,
          name: resource.name,
          location: resource.location,
          capacity: resource.capacity,
          isActive: resource.isActive,
        }}
      />
    </div>
  );
}