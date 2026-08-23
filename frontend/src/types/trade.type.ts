export type TradeSide = "BUY" | "SELL";
export type TradeStatus = "ACTIVE" | "CANCELLED";

export interface Trade {
  id: string;
  tradeSeq: number;
  symbol: string;
  quantity: number;
  price: number;
  side: TradeSide;
  status: TradeStatus;
  tradeTimestamp: string;
  book: string;
  counterparty: string;
  traderId: string;
}

export type TradeEventType = "CREATED" | "UPDATED" | "CANCELLED";

export interface TradeUpdateEvent {
  type: TradeEventType;
  trade: Trade;
}
