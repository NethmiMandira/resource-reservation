import { z } from "zod";
import { ok, handleError } from "@/lib/api-response";
import { requireUser } from "@/lib/current-user";
import { assertAdmin } from "@/lib/permissions";
import { updateResourceSchema } from "@/validators/resource.schema";
import {
  deleteResource,
  getResourceById,
  updateResource,
} from "@/services/resource.service";

type Ctx = { params: Promise<{ id: string }> };

const idSchema = z.string().uuid("Invalid id");

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const id = idSchema.parse((await params).id);
    return ok(await getResourceById(id));
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    assertAdmin(await requireUser());
    const id = idSchema.parse((await params).id);
    const input = updateResourceSchema.parse(await req.json());
    return ok(await updateResource(id, input));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    assertAdmin(await requireUser());
    const id = idSchema.parse((await params).id);
    return ok(await deleteResource(id));
  } catch (e) {
    return handleError(e);
  }
}