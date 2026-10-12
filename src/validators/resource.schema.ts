import { z } from "zod";

export const createResourceSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(100),
  location: z.string().trim().max(100).optional(),
  capacity: z.coerce.number().int().min(1).max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const updateResourceSchema = createResourceSchema.partial();

export const resourceFiltersSchema = z.object({
  categoryId: z.string().uuid().optional(),
  active: z.enum(["true", "false"]).optional(),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;