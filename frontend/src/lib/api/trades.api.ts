import type { GenericTradeResponse, Trade } from "@/types/trade.type";
import { request } from "./core/client";
import type { CreateTradeDTO } from "@/dto/create-trade.dto";
import type { UpdateTradeDTO } from "@/dto/update-trade.dto";

export const tradesApi = {
  list: () => request<Trade[]>("/trades", {}),
  createTrade: (dto: CreateTradeDTO) =>
    request<GenericTradeResponse>("/trades", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  updateTrade: (id: string, dto: UpdateTradeDTO) =>
    request<GenericTradeResponse>(`/trades/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),
  cancelTrade: (id: string) =>
    request<GenericTradeResponse>(`/trades/${id}/cancel`, {
      method: "PATCH",
    }),
};
