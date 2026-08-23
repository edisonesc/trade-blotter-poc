import type { Trade } from "@/types/trade.type";
import { request } from "./core/client";

export const tradesApi = {
  list: () => request<Trade[]>("/trades", {}),
};
