import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcryptUtil from 'src/shared/utils/bcrypt.util';

jest.mock('src/shared/utils/bcrypt.util');

const mockedHashPassword = bcryptUtil.hashPassword as jest.Mock;
const mockedComparePassword = bcryptUtil.comparePassword as jest.Mock;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock; create: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const USER = {
    id: 'user-1',
    email: 'trader@example.com',
    username: 'trader1',
    password: 'hashed-password',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    usersService = { findByEmail: jest.fn(), create: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  describe('register', () => {
    it('throws ConflictException when the email is already registered', async () => {
      usersService.findByEmail.mockResolvedValue(USER);

      await expect(
        service.register(USER.email, USER.username, 'password123'),
      ).rejects.toThrow(ConflictException);
      expect(mockedHashPassword).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('hashes the password, creates the user, and returns a signed access token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      mockedHashPassword.mockResolvedValue('hashed-password');
      usersService.create.mockResolvedValue(USER);

      const result = await service.register(
        USER.email,
        USER.username,
        'plain-password',
      );

      expect(mockedHashPassword).toHaveBeenCalledWith('plain-password');
      expect(usersService.create).toHaveBeenCalledWith(
        USER.email,
        USER.username,
        'hashed-password',
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: USER.id,
        email: USER.email,
        username: USER.username,
      });
      expect(result).toEqual({ accessToken: 'signed.jwt.token' });
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when credentials are invalid', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(USER.email, 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns a signed access token on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(USER);
      mockedComparePassword.mockResolvedValue(true);

      const result = await service.login(USER.email, 'correct-password');

      expect(result).toEqual({ accessToken: 'signed.jwt.token' });
    });
  });

  describe('validateUser', () => {
    it('returns null when no user exists with the given email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(USER.email, 'any-password');

      expect(result).toBeNull();
      expect(mockedComparePassword).not.toHaveBeenCalled();
    });

    it('returns null when the password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(USER);
      mockedComparePassword.mockResolvedValue(false);

      const result = await service.validateUser(USER.email, 'wrong-password');

      expect(result).toBeNull();
    });

    it('returns the user when the password matches', async () => {
      usersService.findByEmail.mockResolvedValue(USER);
      mockedComparePassword.mockResolvedValue(true);

      const result = await service.validateUser(USER.email, 'correct-password');

      expect(result).toEqual(USER);
      expect(mockedComparePassword).toHaveBeenCalledWith(
        'correct-password',
        USER.password,
      );
    });
  });
});
