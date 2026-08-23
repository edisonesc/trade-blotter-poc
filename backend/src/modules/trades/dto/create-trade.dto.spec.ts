import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTradeDTO } from './create-trade.dto';
import { TradeSide } from 'prisma/generated/enums';

const VALID_PAYLOAD = {
  symbol: 'AAPL',
  quantity: 10,
  price: 100.5,
  side: TradeSide.BUY,
  book: 'BOOK-A',
  counterparty: 'CPTY-A',
};

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(CreateTradeDTO, payload));

const omit = (key: keyof typeof VALID_PAYLOAD) => {
  const payload = { ...VALID_PAYLOAD };
  delete payload[key];
  return payload;
};

describe('CreateTradeDTO validation', () => {
  it('passes with a fully valid payload', async () => {
    const errors = await validateDto(VALID_PAYLOAD);
    expect(errors).toHaveLength(0);
  });

  it('fails when symbol is missing', async () => {
    const errors = await validateDto(omit('symbol'));
    expect(errors.some((e) => e.property === 'symbol')).toBe(true);
  });

  it('fails when quantity is not an integer', async () => {
    const errors = await validateDto({ ...VALID_PAYLOAD, quantity: 10.5 });
    expect(errors.some((e) => e.property === 'quantity')).toBe(true);
  });

  it('fails when quantity is not positive', async () => {
    const errors = await validateDto({ ...VALID_PAYLOAD, quantity: -1 });
    expect(errors.some((e) => e.property === 'quantity')).toBe(true);
  });

  it('fails when price is not positive', async () => {
    const errors = await validateDto({ ...VALID_PAYLOAD, price: 0 });
    expect(errors.some((e) => e.property === 'price')).toBe(true);
  });

  it('fails when side is not a valid TradeSide', async () => {
    const errors = await validateDto({ ...VALID_PAYLOAD, side: 'HOLD' });
    expect(errors.some((e) => e.property === 'side')).toBe(true);
  });

  it('fails when book is missing', async () => {
    const errors = await validateDto(omit('book'));
    expect(errors.some((e) => e.property === 'book')).toBe(true);
  });

  it('fails when counterparty is missing', async () => {
    const errors = await validateDto(omit('counterparty'));
    expect(errors.some((e) => e.property === 'counterparty')).toBe(true);
  });
});
