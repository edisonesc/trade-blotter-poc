import { z } from "zod";

export const updateTradeSchema = z.object({
  quantity: z.number().positive("Quantity must be greater than 0"),
  price: z.number().positive("Price must be greater than 0"),
  book: z.string().min(1, "Book is required"),
  counterparty: z.string().min(1, "Counterparty is required"),
});

export type UpdateTradeDTO = z.infer<typeof updateTradeSchema>;
