import Link from "next/link";
import { Table, Td, Th } from "@/components/ui/Table";
import CategoryForm from "@/components/categories/CategoryForm";
import { getCurrentUser } from "@/lib/current-user";
import { isAdmin } from "@/lib/permissions";
import { listCategories } from "@/services/category.service";

export default async function CategoriesPage() {
  const [user, categories] = await Promise.all([getCurrentUser(), listCategories()]);
  const admin = user ? isAdmin(user) : false;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Categories</h1>

      {categories.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No categories yet.
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Description</Th>
              <Th>Resources</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium text-slate-900">{c.name}</Td>
                <Td>{c.description || "—"}</Td>
                <Td>
                  <Link
                    href={`/resources?categoryId=${c.id}`}
                    className="text-slate-700 hover:underline"
                  >
                    {c._count.resources}
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {admin ? (
        <CategoryForm />
      ) : (
        <p className="text-sm text-slate-500">
          Only admins can add categories. Use the &ldquo;Acting as&rdquo; menu to switch to an
          admin.
        </p>
      )}
    </div>
  );
}