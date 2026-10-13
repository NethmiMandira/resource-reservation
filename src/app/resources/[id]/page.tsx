import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import AvailabilityCalendar from "@/components/reservations/AvailabilityCalendar";
import Badge from "@/components/ui/Badge";
import { getCurrentUser } from "@/lib/current-user";
import { addDays, isValidDate, todayColombo } from "@/lib/dates";
import { NotFoundError } from "@/lib/errors";
import { isAdmin } from "@/lib/permissions";
import { getAvailability } from "@/services/reservation.service";
import { getResourceById } from "@/services/resource.service";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const navLink =
  "inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100";

export default async function ResourceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const sp = await searchParams;
  const requested = typeof sp.date === "string" ? sp.date : "";
  const date = isValidDate(requested) ? requested : todayColombo();

  let resource;
  let availability;
  try {
    [resource, availability] = await Promise.all([
      getResourceById(id),
      getAvailability(id, date),
    ]);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const user = await getCurrentUser();
  const admin = user ? isAdmin(user) : false;

  return (
    <div className="space-y-6">
      <Link href="/resources" className="text-sm text-slate-500 hover:underline">
        ← All resources
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{resource.name}</h1>
            <Badge tone={resource.isActive ? "green" : "amber"}>
              {resource.isActive ? "Active" : "Unavailable"}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            {resource.category.name} · {resource.location || "No location"} · Capacity{" "}
            {resource.capacity}
          </p>
        </div>

        <div className="flex gap-2">
          {resource.isActive && (
            <Link
              href={`/reservations/new?resourceId=${resource.id}&date=${date}`}
              className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Book this resource
            </Link>
          )}
          {admin && (
            <Link href={`/resources/${resource.id}/edit`} className={navLink}>
              Edit
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/resources/${resource.id}?date=${addDays(date, -1)}`} className={navLink}>
            ← Previous day
          </Link>
          <Link href={`/resources/${resource.id}?date=${todayColombo()}`} className={navLink}>
            Today
          </Link>
          <Link href={`/resources/${resource.id}?date=${addDays(date, 1)}`} className={navLink}>
            Next day →
          </Link>

          <form method="get" className="ml-auto flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={date}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Show
            </button>
          </form>
        </div>

        <AvailabilityCalendar date={date} busy={availability.busy} />
      </div>
    </div>
  );
}