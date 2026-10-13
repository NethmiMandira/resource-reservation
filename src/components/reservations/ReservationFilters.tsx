"use client";

import { usePathname, useRouter } from "next/navigation";
import Select from "@/components/ui/Select";

type Option = { id: string; name: string };

export default function ReservationFilters({
  resources,
  users,
  values,
}: {
  resources: Option[];
  users: Option[];
  values: { resourceId: string; userId: string; status: string; when: string };
}) {
  const router = useRouter();
  const pathname = usePathname();

  function update(key: keyof typeof values, value: string) {
    const next: Record<string, string> = { ...values };
    next[key] = value;

    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v && !(k === "when" && v === "upcoming")) params.set(k, v);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="w-44">
        <Select label="When" value={values.when} onChange={(e) => update("when", e.target.value)}>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="all">All</option>
        </Select>
      </div>
      <div className="w-52">
        <Select
          label="Resource"
          value={values.resourceId}
          onChange={(e) => update("resourceId", e.target.value)}
        >
          <option value="">All resources</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-48">
        <Select
          label="Booked by"
          value={values.userId}
          onChange={(e) => update("userId", e.target.value)}
        >
          <option value="">Everyone</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-44">
        <Select
          label="Status"
          value={values.status}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="">Any</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>
    </div>
  );
}