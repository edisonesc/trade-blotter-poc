import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from 'src/modules/users/users.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: { findById: jest.Mock };
  let configService: { get: jest.Mock };

  const USER = {
    id: 'user-1',
    email: 'trader@example.com',
    username: 'trader1',
    createdAt: new Date(),
  };

  beforeEach(() => {
    usersService = { findById: jest.fn() };
    configService = {
      get: jest.fn().mockReturnValue('a-sufficiently-long-secret'),
    };

    strategy = new JwtStrategy(
      configService as unknown as ConfigService,
      usersService as unknown as UsersService,
    );
  });

  it('reads JWT_SECRET from ConfigService when constructed', () => {
    expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
  });

  describe('validate', () => {
    it('throws UnauthorizedException when the user no longer exists', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        strategy.validate({ sub: 'stale-id', email: 'x@example.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns the user when found by payload.sub', async () => {
      usersService.findById.mockResolvedValue(USER);

      const result = await strategy.validate({
        sub: USER.id,
        email: USER.email,
      });

      expect(usersService.findById).toHaveBeenCalledWith(USER.id);
      expect(result).toEqual(USER);
    });
  });
});
