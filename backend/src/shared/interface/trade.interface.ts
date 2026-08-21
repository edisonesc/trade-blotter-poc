export interface ITrade {
  id: string;
  symbol: string;
  quantity: number;

  price: number;
  side: string;
  status: string;
  tradeDate: Date;
  traderId: string;
}
