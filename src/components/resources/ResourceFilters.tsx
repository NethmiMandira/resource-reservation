"use client";

import { usePathname, useRouter } from "next/navigation";
import Select from "@/components/ui/Select";

export default function ResourceFilters({
  categories,
  categoryId,
  active,
}: {
  categories: { id: string; name: string }[];
  categoryId: string;
  active: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function update(key: "categoryId" | "active", value: string) {
    const values: Record<string, string> = { categoryId, active };
    values[key] = value;

    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(values)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="w-56">
        <Select
          label="Category"
          value={categoryId}
          onChange={(e) => update("categoryId", e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-48">
        <Select
          label="Status"
          value={active}
          onChange={(e) => update("active", e.target.value)}
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Unavailable</option>
        </Select>
      </div>
    </div>
  );
}