import { describe, expect, it } from "vitest";
import { updateTradeSchema } from "./update-trade.dto";

const validUpdate = {
  quantity: 10,
  price: 150.5,
  book: "BOOK-1",
  counterparty: "GOLDMAN",
};

describe("updateTradeSchema", () => {
  it("accepts a fully valid update", () => {
    expect(updateTradeSchema.safeParse(validUpdate).success).toBe(true);
  });

  it("rejects a zero or negative quantity", () => {
    expect(updateTradeSchema.safeParse({ ...validUpdate, quantity: 0 }).success).toBe(
      false,
    );
    expect(updateTradeSchema.safeParse({ ...validUpdate, quantity: -5 }).success).toBe(
      false,
    );
  });

  it("rejects a zero or negative price", () => {
    expect(updateTradeSchema.safeParse({ ...validUpdate, price: 0 }).success).toBe(
      false,
    );
    expect(updateTradeSchema.safeParse({ ...validUpdate, price: -1 }).success).toBe(
      false,
    );
  });

  it("rejects an empty book or counterparty", () => {
    expect(updateTradeSchema.safeParse({ ...validUpdate, book: "" }).success).toBe(
      false,
    );
    expect(
      updateTradeSchema.safeParse({ ...validUpdate, counterparty: "" }).success,
    ).toBe(false);
  });
});
