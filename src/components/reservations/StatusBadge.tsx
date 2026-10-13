import Badge from "@/components/ui/Badge";

export default function StatusBadge({
  status,
  ended = false,
}: {
  status: "CONFIRMED" | "CANCELLED";
  ended?: boolean;
}) {
  if (status === "CANCELLED") return <Badge tone="red">Cancelled</Badge>;
  if (ended) return <Badge tone="slate">Completed</Badge>;
  return <Badge tone="green">Confirmed</Badge>;
}