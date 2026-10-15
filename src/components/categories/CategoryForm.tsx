"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

type Initial = { id: string; name: string; description: string | null };

type ApiError = {
  error?: {
    message?: string;
    details?: { path: string; message: string }[];
  };
};

export default function CategoryForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const toast = useToast();
  const editId = initial?.id;

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    const trimmed = description.trim();
    const res = await fetch(editId ? `/api/categories/${editId}` : "/api/categories", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: editId ? trimmed : trimmed || undefined }),
    });
    const json = (await res.json().catch(() => null)) as ApiError | null;
    setSubmitting(false);

    if (!res.ok) {
      const details = json?.error?.details;
      if (res.status === 409) {
        setFieldErrors({ name: "A category with this name already exists" });
      } else if (details?.length) {
        setFieldErrors(Object.fromEntries(details.map((d) => [d.path, d.message])));
      }
      toast(json?.error?.message ?? "Could not save the category", "error");
      return;
    }

    if (editId) {
      toast("Category updated");
      router.push("/categories");
    } else {
      toast("Category created");
      setName("");
      setDescription("");
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-5"
    >
      {!editId && <h2 className="font-semibold">Add a category</h2>}
      <Input
        label="Name"
        name="name"
        required
        maxLength={60}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
      />
      <Input
        label="Description"
        name="description"
        maxLength={200}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={fieldErrors.description}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : editId ? "Save changes" : "Add category"}
        </Button>
        {editId && (
          <Link
            href="/categories"
            className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}