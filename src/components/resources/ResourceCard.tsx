import Link from "next/link";
import Badge from "@/components/ui/Badge";
import DeleteResourceButton from "@/components/resources/DeleteResourceButton";

export type ResourceCardData = {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  isActive: boolean;
  category: { name: string };
  _count: { reservations: number };
};

const linkBase =
  "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition";

export default function ResourceCard({
  resource,
  admin,
}: {
  resource: ResourceCardData;
  admin: boolean;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{resource.name}</h3>
          <Badge tone={resource.isActive ? "green" : "amber"}>
            {resource.isActive ? "Active" : "Unavailable"}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">{resource.category.name}</p>
        <dl className="space-y-0.5 text-sm text-slate-600">
          <div className="flex gap-2">
            <dt className="text-slate-400">Location</dt>
            <dd>{resource.location || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-slate-400">Capacity</dt>
            <dd>{resource.capacity}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {resource.isActive && (
          <Link
            href={`/reservations/new?resourceId=${resource.id}`}
            className={`${linkBase} bg-slate-900 text-white hover:bg-slate-700`}
          >
            Book
          </Link>
        )}
        <Link
          href={`/resources/${resource.id}`}
          className={`${linkBase} border border-slate-300 bg-white text-slate-800 hover:bg-slate-100`}
        >
          Availability
        </Link>
        {admin && (
          <>
            <Link
              href={`/resources/${resource.id}/edit`}
              className={`${linkBase} text-slate-700 hover:bg-slate-100`}
            >
              Edit
            </Link>
            <DeleteResourceButton
              id={resource.id}
              name={resource.name}
              isActive={resource.isActive}
              reservationCount={resource._count.reservations}
            />
          </>
        )}
      </div>
    </div>
  );
}