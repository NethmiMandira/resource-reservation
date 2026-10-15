import { ok, handleError } from "@/lib/api-response";
import { requireUser } from "@/lib/current-user";
import { assertAdmin } from "@/lib/permissions";
import { createUserSchema } from "@/validators/user.schema";
import { createUser, listUsers } from "@/services/user.service";

export async function GET() {
  try {
    return ok(await listUsers());
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    assertAdmin(await requireUser());
    const input = createUserSchema.parse(await req.json());
    return ok(await createUser(input), 201);
  } catch (e) {
    return handleError(e);
  }
}