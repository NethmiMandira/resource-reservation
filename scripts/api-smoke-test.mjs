const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let cookie = "";
let failed = 0;

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json };
}

function check(name, res, expected) {
  const pass = res.status === expected;
  if (!pass) failed++;
  const msg = res.json?.error?.message ?? "";
  console.log(
    `${pass ? "✅" : "❌"} ${name}: got ${res.status}, expected ${expected}${msg ? `\n     → ${msg}` : ""}`,
  );
}

const plus = (iso, mins) => new Date(new Date(iso).getTime() + mins * 60000).toISOString();
const login = (user) => call("POST", "/api/users/current", { userId: user.id });

async function main() {
  const users = (await call("GET", "/api/users")).json.data;
  const nimal = users.find((u) => u.name.includes("Nimal"));
  const kamala = users.find((u) => u.name.includes("Kamala"));
  const sunil = users.find((u) => u.name.includes("Sunil"));

  const resources = (await call("GET", "/api/resources")).json.data;
  const room = resources.find((r) => r.name === "Board Room A");

  const categories = (await call("GET", "/api/categories")).json.data;

  const list = (
    await call("GET", `/api/reservations?resourceId=${room.id}&status=CONFIRMED`)
  ).json.data;
  const sprint = list.find((r) => r.title === "Sprint planning");
  const client = list.find((r) => r.title === "Client call");

  if (!sprint || !client || new Date(sprint.startTime) < new Date()) {
    console.log("Seed data is missing or in the past. Run:  npx prisma db seed");
    process.exit(1);
  }

  console.log(`Board Room A, Sprint planning at ${sprint.startTime}\n`);

  // 1. Not logged in
  check(
    "1. Booking without choosing a user",
    await call("POST", "/api/reservations", {
      resourceId: room.id,
      title: "x",
      startTime: sprint.startTime,
      endTime: sprint.endTime,
    }),
    401,
  );

  // 2. Log in as Nimal
  check("2. Choose user Nimal", await login(nimal), 200);

  // 3. Overlap
  check(
    "3. Overlapping booking is rejected",
    await call("POST", "/api/reservations", {
      resourceId: room.id,
      title: "Overlap test",
      startTime: plus(sprint.startTime, 30),
      endTime: plus(sprint.endTime, 30),
    }),
    409,
  );

  // 4. Back-to-back (starts exactly when Client call ends)
  const slot = {
    resourceId: room.id,
    title: "Smoke test",
    startTime: client.endTime,
    endTime: plus(client.endTime, 60),
  };
  const b2b = await call("POST", "/api/reservations", slot);
  check("4. Back-to-back booking is allowed", b2b, 201);

  // 5. Cancel it
  check(
    "5. Cancel own reservation",
    await call("PATCH", `/api/reservations/${b2b.json?.data?.id}`, { status: "CANCELLED" }),
    200,
  );

  // 6. Cancelled slot can be booked again
  const again = await call("POST", "/api/reservations", slot);
  check("6. Cancelled slot can be re-booked", again, 201);

  // 7. Another member cannot cancel it
  await login(kamala);
  check(
    "7. Another member cannot cancel it",
    await call("PATCH", `/api/reservations/${again.json?.data?.id}`, { status: "CANCELLED" }),
    403,
  );

  // Clean up: owner cancels it
  await login(nimal);
  await call("PATCH", `/api/reservations/${again.json?.data?.id}`, { status: "CANCELLED" });

  // 8. Member cannot create a resource
  check(
    "8. Member cannot create a resource",
    await call("POST", "/api/resources", {
      categoryId: categories[0].id,
      name: "Smoke test room",
    }),
    403,
  );

  // 9. Past time
  check(
    "9. Booking in the past is rejected",
    await call("POST", "/api/reservations", {
      resourceId: room.id,
      title: "Past",
      startTime: "2020-01-01T10:00:00+05:30",
      endTime: "2020-01-01T11:00:00+05:30",
    }),
    400,
  );

  // 10. Admin can create a resource (then delete it again)
  await login(sunil);
  const created = await call("POST", "/api/resources", {
    categoryId: categories[0].id,
    name: "Smoke test room",
  });
  check("10. Admin can create a resource", created, 201);
  await call("DELETE", `/api/resources/${created.json?.data?.id}`);

  // 11. Availability
  const day = sprint.startTime.slice(0, 10);
  const avail = await call("GET", `/api/resources/${room.id}/availability?date=${day}`);
  check("11. Availability for the day", avail, 200);
  console.log(`     → ${avail.json?.data?.busy?.length ?? 0} busy slot(s)`);

  console.log(failed === 0 ? "\nAll checks passed 🎉" : `\n${failed} check(s) failed`);
}

main().catch((e) => {
  console.error("Could not reach the server. Is `npm run dev` running?\n", e.message);
  process.exit(1);
});