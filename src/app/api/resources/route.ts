import type { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api-response";
import { requireUser } from "@/lib/current-user";
import { assertAdmin } from "@/lib/permissions";
import {
  createResourceSchema,
  resourceFiltersSchema,
} from "@/validators/resource.schema";
import { createResource, listResources } from "@/services/resource.service";

export async function GET(req: NextRequest) {
  try {
    const filters = resourceFiltersSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams),
    );
    return ok(await listResources(filters));
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    assertAdmin(await requireUser());
    const input = createResourceSchema.parse(await req.json());
    return ok(await createResource(input), 201);
  } catch (e) {
    return handleError(e);
  }
}