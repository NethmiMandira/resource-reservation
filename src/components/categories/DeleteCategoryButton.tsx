"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function DeleteCategoryButton({
  id,
  name,
  resourceCount,
}: {
  id: string;
  name: string;
  resourceCount: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // A category that still has resources cannot be deleted
  if (resourceCount > 0) {
    return (
      <button
        type="button"
        disabled
        title={`Move or delete its ${resourceCount} resource${resourceCount === 1 ? "" : "s"} first`}
        className="cursor-not-allowed rounded-md px-2 py-1 text-sm font-medium text-slate-300"
      >
        Delete
      </button>
    );
  }

  async function confirm() {
    setBusy(true);
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => null);
    setBusy(false);

    if (!res.ok) {
      toast(json?.error?.message ?? "Could not delete the category", "error");
      setOpen(false);
      return;
    }
    toast("Category deleted");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
      <Modal open={open} title="Delete category?" onClose={() => !busy && setOpen(false)}>
        <p className="text-sm text-slate-600">
          &ldquo;{name}&rdquo; will be permanently deleted. This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
            Keep it
          </Button>
          <Button variant="danger" onClick={confirm} disabled={busy}>
            {busy ? "Deleting…" : "Delete category"}
          </Button>
        </div>
      </Modal>
    </>
  );
}