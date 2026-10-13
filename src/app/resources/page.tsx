import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { isAdmin } from "@/lib/permissions";
import { listCategories } from "@/services/category.service";
import { listResources } from "@/services/resource.service";
import { resourceFiltersSchema } from "@/validators/resource.schema";
import ResourceCard from "@/components/resources/ResourceCard";
import ResourceFilters from "@/components/resources/ResourceFilters";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return typeof value === "string" && value ? value : undefined;
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  // Ignore invalid filter values instead of failing the whole page
  const parsed = resourceFiltersSchema.safeParse({
    categoryId: first(sp.categoryId),
    active: first(sp.active),
  });
  const filters = parsed.success ? parsed.data : {};

  const [user, categories, resources] = await Promise.all([
    getCurrentUser(),
    listCategories(),
    listResources(filters),
  ]);
  const admin = user ? isAdmin(user) : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Resources</h1>
        {admin && (
          <Link
            href="/resources/new"
            className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            New resource
          </Link>
        )}
      </div>

      <ResourceFilters
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        categoryId={filters.categoryId ?? ""}
        active={filters.active ?? ""}
      />

      {resources.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No resources match these filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} admin={admin} />
          ))}
        </div>
      )}
    </div>
  );
}