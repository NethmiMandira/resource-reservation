import Link from "next/link";
import { Table, Td, Th } from "@/components/ui/Table";
import CancelButton from "@/components/reservations/CancelButton";
import StatusBadge from "@/components/reservations/StatusBadge";
import { canCancel } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";

export type ReservationRow = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  status: "CONFIRMED" | "CANCELLED";
  resource: { id: string; name: string };
  user: { id: string; name: string };
};

export default function ReservationTable({
  reservations,
  viewer,
}: {
  reservations: ReservationRow[];
  viewer: { id: string; role: "ADMIN" | "MEMBER" } | null;
}) {
  if (reservations.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
        No reservations found.
      </p>
    );
  }

  const now = Date.now();

  return (
    <Table>
      <thead>
        <tr>
          <Th>Title</Th>
          <Th>Resource</Th>
          <Th>Booked by</Th>
          <Th>When</Th>
          <Th>Status</Th>
          <Th>
            <span className="sr-only">Actions</span>
          </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {reservations.map((r) => {
          const ended = r.endTime.getTime() < now;
          const cancellable =
            !!viewer &&
            r.status === "CONFIRMED" &&
            !ended &&
            canCancel(viewer, { userId: r.user.id });

          return (
            <tr key={r.id}>
              <Td className="font-medium text-slate-900">{r.title}</Td>
              <Td>
                <Link href={`/resources/${r.resource.id}`} className="hover:underline">
                  {r.resource.name}
                </Link>
              </Td>
              <Td>{r.user.name}</Td>
              <Td className="whitespace-nowrap">
                {formatDateTime(r.startTime)}
                <span className="text-slate-400"> → </span>
                {formatDateTime(r.endTime)}
              </Td>
              <Td>
                <StatusBadge status={r.status} ended={ended} />
              </Td>
              <Td className="whitespace-nowrap text-right">
                <Link
                  href={`/reservations/${r.id}`}
                  className="rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  View
                </Link>
                {cancellable && <CancelButton reservationId={r.id} title={r.title} />}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}