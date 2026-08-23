import { describe, expect, it } from "vitest";
import { createTradeSchema } from "./create-trade.dto";

const validTrade = {
  symbol: "AAPL",
  quantity: 10,
  price: 150.5,
  side: "BUY" as const,
  book: "BOOK-1",
  counterparty: "GOLDMAN",
};

describe("createTradeSchema", () => {
  it("accepts a fully valid trade", () => {
    expect(createTradeSchema.safeParse(validTrade).success).toBe(true);
  });

  it("rejects an empty symbol", () => {
    const result = createTradeSchema.safeParse({ ...validTrade, symbol: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a zero or negative quantity", () => {
    expect(createTradeSchema.safeParse({ ...validTrade, quantity: 0 }).success).toBe(
      false,
    );
    expect(createTradeSchema.safeParse({ ...validTrade, quantity: -5 }).success).toBe(
      false,
    );
  });

  it("rejects a zero or negative price", () => {
    expect(createTradeSchema.safeParse({ ...validTrade, price: 0 }).success).toBe(
      false,
    );
    expect(createTradeSchema.safeParse({ ...validTrade, price: -1 }).success).toBe(
      false,
    );
  });

  it("rejects a side outside BUY/SELL", () => {
    const result = createTradeSchema.safeParse({ ...validTrade, side: "HOLD" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty book or counterparty", () => {
    expect(createTradeSchema.safeParse({ ...validTrade, book: "" }).success).toBe(
      false,
    );
    expect(
      createTradeSchema.safeParse({ ...validTrade, counterparty: "" }).success,
    ).toBe(false);
  });
});
