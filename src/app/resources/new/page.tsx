import { getCurrentUser } from "@/lib/current-user";
import { isAdmin } from "@/lib/permissions";
import { listCategories } from "@/services/category.service";
import ResourceForm from "@/components/resources/ResourceForm";

export default async function NewResourcePage() {
  const user = await getCurrentUser();

  if (!user || !isAdmin(user)) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">New resource</h1>
        <p className="text-slate-500">
          Only admins can add resources. Use the &ldquo;Acting as&rdquo; menu to switch to an
          admin.
        </p>
      </div>
    );
  }

  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New resource</h1>
      <ResourceForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}