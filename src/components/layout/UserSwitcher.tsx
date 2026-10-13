"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type SwitcherUser = { id: string; name: string; role: "ADMIN" | "MEMBER" };

export default function UserSwitcher({
  users,
  currentId,
}: {
  users: SwitcherUser[];
  currentId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function change(userId: string) {
    setError(null);
    const res = await fetch("/api/users/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      setError("Could not switch user");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="acting-as" className="text-sm text-slate-500">
        Acting as
      </label>
      <select
        id="acting-as"
        value={currentId ?? ""}
        disabled={pending}
        onChange={(e) => change(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-60"
      >
        {!currentId && (
          <option value="" disabled>
            Select a user…
          </option>
        )}
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.role === "ADMIN" ? "admin" : "member"})
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
