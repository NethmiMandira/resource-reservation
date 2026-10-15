import { z } from "zod";
import { ok, handleError } from "@/lib/api-response";
import { requireUser } from "@/lib/current-user";
import { assertAdmin } from "@/lib/permissions";
import { updateCategorySchema } from "@/validators/category.schema";
import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/services/category.service";

type Ctx = { params: Promise<{ id: string }> };

const idSchema = z.string().uuid("Invalid id");

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const id = idSchema.parse((await params).id);
    return ok(await getCategoryById(id));
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    assertAdmin(await requireUser());
    const id = idSchema.parse((await params).id);
    const input = updateCategorySchema.parse(await req.json());
    return ok(await updateCategory(id, input));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    assertAdmin(await requireUser());
    const id = idSchema.parse((await params).id);
    return ok(await deleteCategory(id));
  } catch (e) {
    return handleError(e);
  }
}