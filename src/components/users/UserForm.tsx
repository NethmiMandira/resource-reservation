"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";

type ApiError = {
  error?: {
    message?: string;
    details?: { path: string; message: string }[];
  };
};

export default function UserForm() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role }),
    });
    const json = (await res.json().catch(() => null)) as ApiError | null;
    setSubmitting(false);

    if (!res.ok) {
      const details = json?.error?.details;
      if (res.status === 409) {
        setFieldErrors({ email: "A user with this email already exists" });
      } else if (details?.length) {
        setFieldErrors(Object.fromEntries(details.map((d) => [d.path, d.message])));
      }
      toast(json?.error?.message ?? "Could not add the user", "error");
      return;
    }

    toast("User added");
    setName("");
    setEmail("");
    setRole("MEMBER");
    router.refresh(); // the Acting as menu and Booked for list pick up the new user
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-5"
    >
      <h2 className="font-semibold">Add a user</h2>
      <Input
        label="Name"
        name="name"
        required
        maxLength={80}
        placeholder="e.g. Nethmi Mandira"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        required
        maxLength={120}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
      />
      <Select
        label="Role"
        name="role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        error={fieldErrors.role}
      >
        <option value="MEMBER">Member</option>
        <option value="ADMIN">Admin</option>
      </Select>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Add user"}
      </Button>
    </form>
  );
}