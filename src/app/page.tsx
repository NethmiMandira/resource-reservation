import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { dayStartMs, formatTime, todayColombo } from "@/lib/dates";
import { formatDateTime } from "@/lib/utils";
import { listReservations } from "@/services/reservation.service";
import { listResources } from "@/services/resource.service";

const DAY_MS = 24 * 60 * 60 * 1000;

type Item = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  resource: { name: string };
  user: { name: string };
};

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function List({
  items,
  timeOnly,
  empty,
}: {
  items: Item[];
  timeOnly?: boolean;
  empty: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
        {empty}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
      {items.map((r) => (
        <li key={r.id}>
          <Link
            href={`/reservations/${r.id}`}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50"
          >
            <div>
              <p className="font-medium">{r.title}</p>
              <p className="text-sm text-slate-500">
                {r.resource.name} · {r.user.name}
              </p>
            </div>
            <p className="text-sm text-slate-600">
              {timeOnly
                ? `${formatTime(r.startTime)}–${formatTime(r.endTime)}`
                : `${formatDateTime(r.startTime)} → ${formatTime(r.endTime)}`}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function Dashboard() {
  const now = new Date();
  const horizon = new Date(now.getTime() + 14 * DAY_MS);
  const endOfToday = new Date(dayStartMs(todayColombo()) + DAY_MS);

  const [viewer, resources, reservations] = await Promise.all([
    getCurrentUser(),
    listResources({ active: "true" }),
    listReservations({ status: "CONFIRMED", from: now, to: horizon }),
  ]);

  const busyNow = new Set(
    reservations.filter((r) => r.startTime <= now).map((r) => r.resource.id),
  );
  const freeNow = resources.filter((r) => !busyNow.has(r.id));
  const today = reservations.filter((r) => r.startTime < endOfToday);
  const later = reservations.filter((r) => r.startTime >= endOfToday).slice(0, 5);
  const mine = viewer ? reservations.filter((r) => r.user.id === viewer.id).slice(0, 5) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {viewer ? `Hello, ${viewer.name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-sm text-slate-500">
            See what is free right now and what is coming up.
          </p>
        </div>
        <Link
          href="/reservations/new"
          className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          New reservation
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Free right now"
          value={`${freeNow.length} / ${resources.length}`}
          hint="Active resources with no booking at this moment"
        />
        <Stat
          label="Still to happen today"
          value={String(today.length)}
          hint="Ongoing and remaining reservations today"
        />
        <Stat
          label="Next 14 days"
          value={String(reservations.length)}
          hint="Confirmed reservations"
        />
      </div>

      <Section title="Today">
        <List items={today} timeOnly empty="Nothing else is booked for today." />
      </Section>

      <Section title="Free right now">
        {freeNow.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Every active resource is in use at the moment.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {freeNow.map((r) => (
              <Link
                key={r.id}
                href={`/resources/${r.id}`}
                className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-800 hover:bg-green-100"
              >
                {r.name}
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Your upcoming reservations"
        action={
          <Link href="/reservations" className="text-sm text-slate-500 hover:underline">
            View all
          </Link>
        }
      >
        {viewer ? (
          <List items={mine} empty="You have no upcoming reservations." />
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Choose who you are from the &ldquo;Acting as&rdquo; menu to see your reservations.
          </p>
        )}
      </Section>

      <Section title="Coming up">
        <List items={later} empty="No reservations after today in the next 14 days." />
      </Section>
    </div>
  );
}