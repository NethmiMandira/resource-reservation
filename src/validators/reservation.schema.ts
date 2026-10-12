import { z } from "zod";

export const createReservationSchema = z
  .object({
    resourceId: z.string().uuid(),
    title: z.string().trim().min(1, "Title is required").max(120),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine((v) => v.startTime.getTime() > Date.now() - 60_000, {
    message: "Start time cannot be in the past",
    path: ["startTime"],
  });

export const reservationFiltersSchema = z.object({
  resourceId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z.enum(["CONFIRMED", "CANCELLED"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ReservationFilters = z.infer<typeof reservationFiltersSchema>;