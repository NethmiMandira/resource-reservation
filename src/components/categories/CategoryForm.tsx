"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

type ApiError = {
  error?: {
    message?: string;
    details?: { path: string; message: string }[];
  };
};

export default function CategoryForm() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description.trim() || undefined }),
    });
    const json = (await res.json().catch(() => null)) as ApiError | null;
    setSubmitting(false);

    if (!res.ok) {
      const details = json?.error?.details;
      if (details?.length) {
        setFieldErrors(Object.fromEntries(details.map((d) => [d.path, d.message])));
      }
      toast(json?.error?.message ?? "Could not create the category", "error");
      return;
    }

    toast("Category created");
    setName("");
    setDescription("");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-5"
    >
      <h2 className="font-semibold">Add a category</h2>
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
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Add category"}
      </Button>
    </form>
  );
}