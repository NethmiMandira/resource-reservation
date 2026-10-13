// Sri Lanka has no daylight saving, so a fixed +05:30 offset is safe.
const TZ = "Asia/Colombo";
const OFFSET = "+05:30";
const DAY_MS = 24 * 60 * 60 * 1000;

const dateFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }); // YYYY-MM-DD

export function todayColombo() {
  return dateFormat.format(new Date());
}

export function isValidDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00${OFFSET}`).getTime())
  );
}

export function dayStartMs(date: string) {
  return new Date(`${date}T00:00:00${OFFSET}`).getTime();
}

export function addDays(date: string, days: number) {
  return dateFormat.format(new Date(dayStartMs(date) + days * DAY_MS));
}

// "2026-10-14" + "10:30" -> "2026-10-14T10:30:00+05:30"
export function toColomboIso(date: string, time: string) {
  return `${date}T${time.length === 5 ? `${time}:00` : time}${OFFSET}`;
}

export function formatTime(value: Date | string) {
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function formatDateLong(date: string) {
  return new Date(dayStartMs(date)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}