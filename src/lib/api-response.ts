import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return fail(
      400,
      "VALIDATION_ERROR",
      "Invalid input",
      err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }

  if (err instanceof SyntaxError) {
    return fail(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  if (err instanceof AppError) {
    return fail(err.status, err.code, err.message);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return fail(409, "CONFLICT", "A record with this value already exists");
    }
    if (err.code === "P2003") {
      return fail(
        409,
        "CONFLICT",
        "This record is still in use or refers to something that does not exist",
      );
    }
    if (err.code === "P2025") {
      return fail(404, "NOT_FOUND", "Record not found");
    }
  }

  console.error(err);
  return fail(500, "INTERNAL_ERROR", "Something went wrong");
}