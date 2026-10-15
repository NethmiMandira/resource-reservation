import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import CancelButton from "@/components/reservations/CancelButton";
import StatusBadge from "@/components/reservations/StatusBadge";
import { getCurrentUser } from "@/lib/current-user";
import { NotFoundError } from "@/lib/errors";
import { canCancel } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";
import { getReservationById } from "@/services/reservation.service";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  let reservation;
  try {
    reservation = await getReservationById(id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const viewer = await getCurrentUser();
  const ended = reservation.endTime.getTime() < Date.now();
  const cancellable =
    !!viewer &&
    reservation.status === "CONFIRMED" &&
    !ended &&
    canCancel(viewer, { userId: reservation.userId });

  const rows: [string, React.ReactNode][] = [
    [
      "Resource",
      <Link
        key="resource"
        href={`/resources/${reservation.resource.id}`}
        className="hover:underline"
      >
        {reservation.resource.name} ({reservation.resource.category.name})
      </Link>,
    ],
    ["Booked by", `${reservation.user.name} (${reservation.user.email})`],
    ["Starts", formatDateTime(reservation.startTime)],
    ["Ends", formatDateTime(reservation.endTime)],
    ["Booked on", formatDateTime(reservation.createdAt)],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/reservations" className="text-sm text-slate-500 hover:underline">
        ← All reservations
      </Link>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-semibold">{reservation.title}</h1>
          <StatusBadge status={reservation.status} ended={ended} />
        </div>

        <dl className="divide-y divide-slate-100 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex gap-4 py-2">
              <dt className="w-28 shrink-0 text-slate-500">{label}</dt>
              <dd className="text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>

        {cancellable && (
          <div className="pt-2">
            <CancelButton reservationId={reservation.id} title={reservation.title} />
          </div>
        )}
      </div>
    </div>
  );
}