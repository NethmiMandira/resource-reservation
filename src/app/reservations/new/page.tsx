import { getCurrentUser } from "@/lib/current-user";
import { isValidDate } from "@/lib/dates";
import { isAdmin } from "@/lib/permissions";
import { listResources } from "@/services/resource.service";
import { listUsers } from "@/services/user.service";
import ReservationForm from "@/components/reservations/ReservationForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return typeof value === "string" && value ? value : undefined;
}

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const date = first(sp.date);

  const [user, resources, users] = await Promise.all([
    getCurrentUser(),
    listResources({ active: "true" }),
    listUsers(),
  ]);
  const admin = user ? isAdmin(user) : false;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New reservation</h1>
      <ReservationForm
        signedIn={!!user}
        currentUserId={user?.id}
        users={admin ? users.map((u) => ({ id: u.id, name: u.name })) : undefined}
        initialResourceId={first(sp.resourceId)}
        initialDate={date && isValidDate(date) ? date : undefined}
        resources={resources.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category.name,
        }))}
      />
    </div>
  );
}