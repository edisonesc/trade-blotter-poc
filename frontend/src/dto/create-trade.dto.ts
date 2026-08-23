import { z } from "zod";

export const createTradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  price: z.number().positive("Price must be greater than 0"),
  side: z.enum(["BUY", "SELL"]),
  book: z.string().min(1, "Book is required"),
  counterparty: z.string().min(1, "Counterparty is required"),
});

export type CreateTradeDTO = z.infer<typeof createTradeSchema>;
