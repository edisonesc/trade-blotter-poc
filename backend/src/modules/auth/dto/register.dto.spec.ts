import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDTO } from './register.dto';

const VALID_PAYLOAD = {
  email: 'trader@example.com',
  username: 'trader1',
  password: 'password123',
};

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(RegisterDTO, payload));

describe('RegisterDTO validation', () => {
  it('passes with a fully valid payload', async () => {
    const errors = await validateDto(VALID_PAYLOAD);
    expect(errors).toHaveLength(0);
  });

  it('fails with an invalid email', async () => {
    const errors = await validateDto({
      ...VALID_PAYLOAD,
      email: 'not-an-email',
    });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('fails when username is shorter than 5 characters', async () => {
    const errors = await validateDto({ ...VALID_PAYLOAD, username: 'ab' });
    expect(errors.some((e) => e.property === 'username')).toBe(true);
  });

  it('fails when password is shorter than 8 characters', async () => {
    const errors = await validateDto({ ...VALID_PAYLOAD, password: 'short' });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  // RegisterDTO.password has no @IsString() decorator (unlike LoginDTO.password),
  // only @MinLength(8). class-validator's MinLength still rejects non-strings
  // internally (it requires typeof value === 'string'), so this is a stylistic
  // asymmetry rather than an actual validation gap.
  it('still rejects a non-string password via MinLength', async () => {
    const errors = await validateDto({
      ...VALID_PAYLOAD,
      password: 123456789,
    });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});
