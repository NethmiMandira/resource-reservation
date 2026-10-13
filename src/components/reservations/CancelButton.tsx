"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function CancelButton({
  reservationId,
  title,
}: {
  reservationId: string;
  title: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const res = await fetch(`/api/reservations/${reservationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    const json = await res.json().catch(() => null);
    setBusy(false);

    if (!res.ok) {
      toast(json?.error?.message ?? "Could not cancel the reservation", "error");
      return;
    }
    toast("Reservation cancelled");
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
        Cancel
      </button>
      <Modal open={open} title="Cancel reservation?" onClose={() => !busy && setOpen(false)}>
        <p className="text-sm text-slate-600">
          &ldquo;{title}&rdquo; will be cancelled and the time slot becomes available again.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
            Keep it
          </Button>
          <Button variant="danger" onClick={confirm} disabled={busy}>
            {busy ? "Cancelling…" : "Cancel reservation"}
          </Button>
        </div>
      </Modal>
    </>
  );
}