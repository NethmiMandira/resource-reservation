"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import AvailabilityCalendar, {
  type BusySlot,
} from "@/components/reservations/AvailabilityCalendar";
import { todayColombo, toColomboIso } from "@/lib/dates";

export type ResourceOption = { id: string; name: string; category: string };
export type UserOption = { id: string; name: string };

type ApiError = {
  error?: {
    message?: string;
    details?: { path: string; message: string }[];
  };
};

export default function ReservationForm({
  resources,
  users,
  currentUserId,
  initialResourceId,
  initialDate,
  signedIn,
}: {
  resources: ResourceOption[];
  // Only passed for admins: lets them book on behalf of someone else
  users?: UserOption[];
  currentUserId?: string;
  initialResourceId?: string;
  initialDate?: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [resourceId, setResourceId] = useState(
    resources.some((r) => r.id === initialResourceId) ? (initialResourceId as string) : "",
  );
  const [bookedFor, setBookedFor] = useState(currentUserId ?? "");
  const [date, setDate] = useState(initialDate ?? todayColombo());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [title, setTitle] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Availability of the chosen resource on the chosen day
  const key = resourceId && date ? `${resourceId}|${date}|${refreshKey}` : "";
  const [loaded, setLoaded] = useState<{ key: string; busy: BusySlot[] }>({
    key: "",
    busy: [],
  });

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/resources/${resourceId}/availability?date=${date}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((json) => setLoaded({ key, busy: json?.data?.busy ?? [] }))
      .catch(() => {});
    return () => controller.abort();
  }, [key, resourceId, date]);

  const loading = key !== "" && loaded.key !== key;
  const busy = key !== "" && loaded.key === key ? loaded.busy : [];

  const selected = useMemo(() => {
    if (!date || !startTime || !endTime) return null;
    const start = new Date(toColomboIso(date, startTime));
    const end = new Date(toColomboIso(date, endTime));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return null;
    }
    return { start, end };
  }, [date, startTime, endTime]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setConflict(null);
    setFormError(null);
    setFieldErrors({});

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceId,
        title,
        ...(users && bookedFor ? { userId: bookedFor } : {}),
        startTime: toColomboIso(date, startTime),
        endTime: toColomboIso(date, endTime),
      }),
    });
    const json = (await res.json().catch(() => null)) as ApiError | null;

    if (res.ok) {
      toast("Reservation created");
      router.push("/reservations");
      router.refresh();
      return;
    }

    const message = json?.error?.message ?? "Something went wrong";
    if (res.status === 409) {
      setConflict(message);
      setRefreshKey((k) => k + 1); // reload the calendar so the clash is visible
    } else if (json?.error?.details?.length) {
      setFieldErrors(Object.fromEntries(json.error.details.map((d) => [d.path, d.message])));
    } else {
      setFormError(message);
    }
    toast(message, "error");
    setSubmitting(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-5"
      >
        {!signedIn && (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Choose who you are from the &ldquo;Acting as&rdquo; menu before booking.
          </p>
        )}

        <Select
          label="Resource"
          name="resourceId"
          required
          value={resourceId}
          onChange={(e) => {
            setResourceId(e.target.value);
            setConflict(null);
          }}
          error={fieldErrors.resourceId}
        >
          <option value="" disabled>
            Select a resource…
          </option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.category})
            </option>
          ))}
        </Select>

        {users && (
          <Select
            label="Booked for"
            name="userId"
            value={bookedFor}
            onChange={(e) => setBookedFor(e.target.value)}
            error={fieldErrors.userId}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
                {u.id === currentUserId ? " (you)" : ""}
              </option>
            ))}
          </Select>
        )}

        <Input
          label="Title"
          name="title"
          required
          maxLength={120}
          placeholder="e.g. Sprint planning"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title}
        />

        <Input
          label="Date"
          name="date"
          type="date"
          required
          min={todayColombo()}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setConflict(null);
          }}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start"
            name="startTime"
            type="time"
            required
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              setConflict(null);
            }}
            error={fieldErrors.startTime}
          />
          <Input
            label="End"
            name="endTime"
            type="time"
            required
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              setConflict(null);
            }}
            error={fieldErrors.endTime}
          />
        </div>

        {conflict && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            <p className="font-semibold">That time can&apos;t be booked</p>
            <p>{conflict}</p>
            <p className="mt-1 text-red-700">
              Pick a free slot on the calendar and try again.
            </p>
          </div>
        )}

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <Button type="submit" disabled={submitting || !signedIn}>
          {submitting ? "Booking…" : "Book resource"}
        </Button>
      </form>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Availability</h2>
        {!resourceId ? (
          <p className="text-sm text-slate-500">
            Choose a resource to see what is already booked.
          </p>
        ) : loading ? (
          <p className="text-sm text-slate-500">Loading availability…</p>
        ) : (
          <AvailabilityCalendar date={date} busy={busy} selected={selected} />
        )}
      </div>
    </div>
  );
}