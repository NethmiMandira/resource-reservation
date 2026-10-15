import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;