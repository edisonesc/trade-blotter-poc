import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDTO } from './login.dto';

const VALID_PAYLOAD = {
  email: 'trader@example.com',
  password: 'password123',
};

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(LoginDTO, payload));

describe('LoginDTO validation', () => {
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

  // Unlike RegisterDTO.password (@MinLength only), LoginDTO.password has
  // @IsString(), so a non-string value is correctly rejected here.
  it('fails when password is not a string', async () => {
    const errors = await validateDto({ ...VALID_PAYLOAD, password: 123456789 });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});
