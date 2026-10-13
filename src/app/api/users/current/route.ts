import { cookies } from "next/headers";
import { z } from "zod";
import { ok, handleError } from "@/lib/api-response";
import { getCurrentUser, USER_COOKIE } from "@/lib/current-user";
import { getUserById } from "@/services/user.service";

const bodySchema = z.object({ userId: z.string().uuid() });

export async function GET() {
  try {
    return ok(await getCurrentUser());
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = bodySchema.parse(await req.json());
    const user = await getUserById(userId);
    (await cookies()).set(USER_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return ok(user);
  } catch (e) {
    return handleError(e);
  }
}