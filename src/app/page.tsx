import { listReservations } from "@/services/reservation.service";
import { formatDateTime } from "@/lib/utils";

export default async function Home() {
  const upcoming = (
    await listReservations({ status: "CONFIRMED", from: new Date() })
  ).slice(0, 8);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Upcoming reservations</h1>
      {upcoming.length === 0 ? (
        <p className="text-slate-500">No upcoming reservations.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {upcoming.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-slate-500">
                  {r.resource.name} · {r.user.name}
                </p>
              </div>
              <p className="text-sm text-slate-600">
                {formatDateTime(r.startTime)} → {formatDateTime(r.endTime)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
