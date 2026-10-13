"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";

type Initial = {
  id: string;
  categoryId: string;
  name: string;
  location: string | null;
  capacity: number;
  isActive: boolean;
};

type ApiError = {
  error?: {
    message?: string;
    details?: { path: string; message: string }[];
  };
};

export default function ResourceForm({
  categories,
  initial,
}: {
  categories: { id: string; name: string }[];
  initial?: Initial;
}) {
  const router = useRouter();
  const toast = useToast();
  const editId = initial?.id;

  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? 1));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    const trimmedLocation = location.trim();
    const body = {
      categoryId,
      name,
      location: trimmedLocation || (editId ? "" : undefined),
      capacity: Number(capacity),
      isActive,
    };

    const res = await fetch(editId ? `/api/resources/${editId}` : "/api/resources", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as ApiError | null;

    if (!res.ok) {
      const details = json?.error?.details;
      if (details?.length) {
        setFieldErrors(Object.fromEntries(details.map((d) => [d.path, d.message])));
      }
      setFormError(json?.error?.message ?? "Something went wrong");
      toast(json?.error?.message ?? "Something went wrong", "error");
      setSubmitting(false);
      return;
    }

    toast(editId ? "Resource updated" : "Resource created");
    router.push("/resources");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-5"
    >
      <Select
        label="Category"
        name="categoryId"
        required
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        error={fieldErrors.categoryId}
      >
        <option value="" disabled>
          Select a category…
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Input
        label="Name"
        name="name"
        required
        maxLength={100}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
      />

      <Input
        label="Location"
        name="location"
        maxLength={100}
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        error={fieldErrors.location}
      />

      <Input
        label="Capacity"
        name="capacity"
        type="number"
        min={1}
        max={1000}
        required
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        error={fieldErrors.capacity}
      />

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Available for booking
      </label>

      {formError && !Object.keys(fieldErrors).length && (
        <p className="text-sm text-red-600">{formError}</p>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : editId ? "Save changes" : "Create resource"}
        </Button>
        <Link
          href="/resources"
          className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}