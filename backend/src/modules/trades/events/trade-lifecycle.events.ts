import { Trade } from 'prisma/generated/client';

export const TRADE_EVENTS = {
  CREATED: 'trade.created',
  UPDATED: 'trade.updated',
  CANCELLED: 'trade.cancelled',
} as const;

export interface TradeEventPayload {
  trade: Trade;
}

export type TradeEventType = (typeof TRADE_EVENTS)[keyof typeof TRADE_EVENTS];
