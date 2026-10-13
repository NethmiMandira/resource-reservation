import type { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api-response";
import { requireUser } from "@/lib/current-user";
import {
  createReservationSchema,
  reservationFiltersSchema,
} from "@/validators/reservation.schema";
import {
  createReservation,
  listReservations,
} from "@/services/reservation.service";

export async function GET(req: NextRequest) {
  try {
    const filters = reservationFiltersSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams),
    );
    return ok(await listReservations(filters));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = createReservationSchema.parse(await req.json());
    return ok(await createReservation(input, user), 201);
  } catch (e) {
    return handleError(e);
  }
}