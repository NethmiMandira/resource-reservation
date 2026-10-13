import type { NextRequest } from "next/server";
import { z } from "zod";
import { ok, handleError } from "@/lib/api-response";
import { availabilityQuerySchema } from "@/validators/reservation.schema";
import { getAvailability } from "@/services/reservation.service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const id = z.string().uuid("Invalid id").parse((await params).id);
    const { date } = availabilityQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams),
    );
    return ok(await getAvailability(id, date));
  } catch (e) {
    return handleError(e);
  }
}