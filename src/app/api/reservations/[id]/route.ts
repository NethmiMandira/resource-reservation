import { z } from "zod";
import { ok, handleError } from "@/lib/api-response";
import { requireUser } from "@/lib/current-user";
import {
  cancelReservation,
  getReservationById,
} from "@/services/reservation.service";

type Ctx = { params: Promise<{ id: string }> };

const idSchema = z.string().uuid("Invalid id");
const patchSchema = z.object({ status: z.literal("CANCELLED") });

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const id = idSchema.parse((await params).id);
    return ok(await getReservationById(id));
  } catch (e) {
    return handleError(e);
  }
}

// PATCH { "status": "CANCELLED" } cancels the reservation
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const id = idSchema.parse((await params).id);
    patchSchema.parse(await req.json());
    return ok(await cancelReservation(id, user));
  } catch (e) {
    return handleError(e);
  }
}