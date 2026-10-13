import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { listReservations } from "@/services/reservation.service";
import { listResources } from "@/services/resource.service";
import { listUsers } from "@/services/user.service";
import { reservationFiltersSchema } from "@/validators/reservation.schema";
import ReservationFilters from "@/components/reservations/ReservationFilters";
import ReservationTable from "@/components/reservations/ReservationTable";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return typeof value === "string" && value ? value : undefined;
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const whenParam = first(sp.when);
  const when = whenParam === "past" || whenParam === "all" ? whenParam : "upcoming";

  // Ignore invalid filter values instead of failing the whole page
  const parsed = reservationFiltersSchema.safeParse({
    resourceId: first(sp.resourceId),
    userId: first(sp.userId),
    status: first(sp.status),
  });
  const filters = parsed.success ? parsed.data : {};

  const now = new Date();
  const [viewer, resources, users, found] = await Promise.all([
    getCurrentUser(),
    listResources(),
    listUsers(),
    listReservations({
      ...filters,
      ...(when === "upcoming" && { from: now }),
      ...(when === "past" && { to: now }),
    }),
  ]);
  const reservations = when === "past" ? [...found].reverse() : found;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reservations</h1>
        <Link
          href="/reservations/new"
          className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          New reservation
        </Link>
      </div>

      <ReservationFilters
        resources={resources.map((r) => ({ id: r.id, name: r.name }))}
        users={users.map((u) => ({ id: u.id, name: u.name }))}
        values={{
          resourceId: filters.resourceId ?? "",
          userId: filters.userId ?? "",
          status: filters.status ?? "",
          when,
        }}
      />

      <ReservationTable
        reservations={reservations}
        viewer={viewer ? { id: viewer.id, role: viewer.role } : null}
      />
    </div>
  );
}