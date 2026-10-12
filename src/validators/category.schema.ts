import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  description: z.string().trim().max(200).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;