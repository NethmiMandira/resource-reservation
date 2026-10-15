"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function DeleteResourceButton({
  id,
  name,
  isActive,
  reservationCount,
}: {
  id: string;
  name: string;
  isActive: boolean;
  reservationCount: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const hasHistory = reservationCount > 0;

  // Nothing left to do: it cannot be deleted and is already unavailable
  if (hasHistory && !isActive) {
    return (
      <button
        type="button"
        disabled
        title="It has reservations, so it can only be marked unavailable (already done)"
        className="cursor-not-allowed rounded-md px-3 py-1.5 text-sm font-medium text-slate-300"
      >
        Delete
      </button>
    );
  }

  async function confirm() {
    setBusy(true);
    const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => null);
    setBusy(false);

    if (!res.ok) {
      toast(json?.error?.message ?? "Could not delete the resource", "error");
      setOpen(false);
      return;
    }
    toast(
      json?.data?.deleted
        ? "Resource deleted"
        : "Resource marked unavailable (its reservation history is kept)",
    );
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
      <Modal open={open} title="Delete resource?" onClose={() => !busy && setOpen(false)}>
        {hasHistory ? (
          <p className="text-sm text-slate-600">
            &ldquo;{name}&rdquo; has {reservationCount} reservation
            {reservationCount === 1 ? "" : "s"}, so it cannot be removed completely. It will be
            marked <strong>Unavailable</strong> instead and the booking history is kept.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            &ldquo;{name}&rdquo; will be permanently deleted. This cannot be undone.
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
            Keep it
          </Button>
          <Button variant="danger" onClick={confirm} disabled={busy}>
            {busy ? "Working…" : hasHistory ? "Mark unavailable" : "Delete resource"}
          </Button>
        </div>
      </Modal>
    </>
  );
}