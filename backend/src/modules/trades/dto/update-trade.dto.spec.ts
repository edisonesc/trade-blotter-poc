import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateTradeDTO } from './update-trade.dto';

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(UpdateTradeDTO, payload));

describe('UpdateTradeDTO validation', () => {
  it('passes with an empty payload since every field is optional', async () => {
    // DTO-level validation alone does not catch a no-op update; that's
    // enforced separately by TradesService.updateTrade's isObjectEmpty check.
    const errors = await validateDto({});
    expect(errors).toHaveLength(0);
  });

  it('passes with a partial payload', async () => {
    const errors = await validateDto({ book: 'NEW-BOOK' });
    expect(errors).toHaveLength(0);
  });

  it('fails when a provided quantity is not a positive integer', async () => {
    const errors = await validateDto({ quantity: -5 });
    expect(errors.some((e) => e.property === 'quantity')).toBe(true);
  });

  it('fails when a provided price is not a number', async () => {
    const errors = await validateDto({ price: 'not-a-number' });
    expect(errors.some((e) => e.property === 'price')).toBe(true);
  });

  it('fails when a provided book is not a string', async () => {
    const errors = await validateDto({ book: 123 });
    expect(errors.some((e) => e.property === 'book')).toBe(true);
  });
});
