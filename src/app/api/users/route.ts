import { ok, handleError } from "@/lib/api-response";
import { listUsers } from "@/services/user.service";

export async function GET() {
  try {
    return ok(await listUsers());
  } catch (e) {
    return handleError(e);
  }
}