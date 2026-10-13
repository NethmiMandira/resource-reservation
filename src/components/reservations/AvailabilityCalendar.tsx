import { cn } from "@/lib/utils";
import { dayStartMs, formatDateLong, formatTime } from "@/lib/dates";

export type BusySlot = {
  id: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  user: { name: string };
};

type Range = { start: Date | string; end: Date | string };

const DAY_MS = 24 * 60 * 60 * 1000;
const TICKS = [0, 3, 6, 9, 12, 15, 18, 21];

export default function AvailabilityCalendar({
  date,
  busy,
  selected,
}: {
  date: string;
  busy: BusySlot[];
  selected?: Range | null;
}) {
  const dayStart = dayStartMs(date);
  const pct = (ms: number) => Math.min(100, Math.max(0, ((ms - dayStart) / DAY_MS) * 100));
  const place = (start: Date | string, end: Date | string) => {
    const left = pct(new Date(start).getTime());
    const right = pct(new Date(end).getTime());
    return { left: `${left}%`, width: `${Math.max(right - left, 0.8)}%` };
  };

  const selStart = selected ? new Date(selected.start).getTime() : 0;
  const selEnd = selected ? new Date(selected.end).getTime() : 0;
  const clashes =
    !!selected &&
    busy.some(
      (b) =>
        selStart < new Date(b.endTime).getTime() && selEnd > new Date(b.startTime).getTime(),
    );

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">{formatDateLong(date)}</p>

      <div>
        <div className="relative h-10 overflow-hidden rounded-md border border-slate-200 bg-green-50">
          {busy.map((b) => (
            <div
              key={b.id}
              title={`${b.title} (${formatTime(b.startTime)}–${formatTime(b.endTime)}, ${b.user.name})`}
              style={place(b.startTime, b.endTime)}
              className="absolute inset-y-0 bg-slate-700"
            />
          ))}
          {selected && (
            <div
              title="Your selected time"
              style={place(selected.start, selected.end)}
              className={cn(
                "absolute inset-y-1 rounded border-2 border-dashed",
                clashes ? "border-red-600 bg-red-500/30" : "border-green-700 bg-green-500/30",
              )}
            />
          )}
        </div>
        <div className="relative mt-1 h-4 text-[10px] text-slate-500">
          {TICKS.map((h) => (
            <span
              key={h}
              style={{ left: `${(h / 24) * 100}%` }}
              className="absolute -translate-x-1/2 first:translate-x-0"
            >
              {String(h).padStart(2, "0")}:00
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-green-100 ring-1 ring-slate-200" />
          Free
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-slate-700" />
          Booked
        </span>
        {selected && (
          <span className={cn("flex items-center gap-1", clashes ? "text-red-600" : "text-green-700")}>
            <span
              className={cn(
                "inline-block h-3 w-3 rounded-sm border-2 border-dashed",
                clashes ? "border-red-600" : "border-green-700",
              )}
            />
            {clashes ? "Your time overlaps a booking" : "Your time is free"}
          </span>
        )}
      </div>

      {busy.length === 0 ? (
        <p className="text-sm text-slate-500">No bookings. Free all day.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white text-sm">
          {busy.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="font-medium text-slate-800">
                {formatTime(b.startTime)}–{formatTime(b.endTime)}
              </span>
              <span className="text-slate-600">
                {b.title} · {b.user.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}