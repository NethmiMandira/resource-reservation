import Badge from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";
import { getCurrentUser } from "@/lib/current-user";
import { isAdmin } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";
import { listUsers } from "@/services/user.service";

export default async function UsersPage() {
  const user = await getCurrentUser();

  if (!user || !isAdmin(user)) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-slate-500">
          Only admins can view users. Use the &ldquo;Acting as&rdquo; menu to switch to an admin.
        </p>
      </div>
    );
  }

  const users = await listUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Joined</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u.id}>
              <Td className="font-medium text-slate-900">{u.name}</Td>
              <Td>{u.email}</Td>
              <Td>
                <Badge tone={u.role === "ADMIN" ? "amber" : "slate"}>
                  {u.role === "ADMIN" ? "Admin" : "Member"}
                </Badge>
              </Td>
              <Td className="whitespace-nowrap">{formatDateTime(u.createdAt)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}