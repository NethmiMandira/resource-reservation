import { ok, handleError } from "@/lib/api-response";
import { requireUser } from "@/lib/current-user";
import { assertAdmin } from "@/lib/permissions";
import { createCategorySchema } from "@/validators/category.schema";
import { createCategory, listCategories } from "@/services/category.service";

export async function GET() {
  try {
    return ok(await listCategories());
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    assertAdmin(await requireUser());
    const input = createCategorySchema.parse(await req.json());
    return ok(await createCategory(input), 201);
  } catch (e) {
    return handleError(e);
  }
}