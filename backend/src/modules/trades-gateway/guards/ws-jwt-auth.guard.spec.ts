import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsJwtAuthGuard } from './ws-jwt-auth.guard';
import { UsersService } from 'src/modules/users/users.service';
import { AuthenticatedSocket } from '../trades-gateway.types';

describe('WsJwtAuthGuard', () => {
  let guard: WsJwtAuthGuard;
  let jwtService: { verify: jest.Mock };
  let usersService: { findById: jest.Mock };

  const USER = {
    id: 'user-1',
    email: 'trader@example.com',
    username: 'trader1',
    createdAt: new Date(),
  };

  const makeClient = (
    overrides: Partial<{
      auth: Record<string, unknown>;
      headers: Record<string, unknown>;
      data: Record<string, unknown>;
    }> = {},
  ) =>
    ({
      handshake: {
        auth: overrides.auth ?? {},
        headers: overrides.headers ?? {},
      },
      data: overrides.data ?? {},
    }) as unknown as AuthenticatedSocket;

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    usersService = { findById: jest.fn() };
    guard = new WsJwtAuthGuard(
      jwtService as unknown as JwtService,
      usersService as unknown as UsersService,
    );
  });

  describe('extractToken', () => {
    it('prefers handshake.auth.token when present', () => {
      const client = makeClient({
        auth: { token: 'auth-token' },
        headers: { authorization: 'Bearer header-token' },
      });

      expect(guard.extractToken(client)).toBe('auth-token');
    });

    it('falls back to the Authorization: Bearer header', () => {
      const client = makeClient({
        headers: { authorization: 'Bearer header-token' },
      });

      expect(guard.extractToken(client)).toBe('header-token');
    });

    it('returns undefined when neither source has a token', () => {
      const client = makeClient();

      expect(guard.extractToken(client)).toBeUndefined();
    });
  });

  describe('authenticate', () => {
    it('throws UnauthorizedException when no token is present', async () => {
      const client = makeClient();

      await expect(guard.authenticate(client)).rejects.toThrow('Missing token');
    });

    it('throws UnauthorizedException when the token is invalid or expired', async () => {
      const client = makeClient({ auth: { token: 'bad-token' } });
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(guard.authenticate(client)).rejects.toThrow(
        'Invalid or expired token',
      );
    });

    it('throws UnauthorizedException when the decoded user no longer exists', async () => {
      const client = makeClient({ auth: { token: 'valid-token' } });
      jwtService.verify.mockReturnValue({
        sub: 'stale-id',
        email: 'x@example.com',
      });
      usersService.findById.mockResolvedValue(null);

      await expect(guard.authenticate(client)).rejects.toThrow();
    });

    it('returns the user on a valid token', async () => {
      const client = makeClient({ auth: { token: 'valid-token' } });
      jwtService.verify.mockReturnValue({ sub: USER.id, email: USER.email });
      usersService.findById.mockResolvedValue(USER);

      await expect(guard.authenticate(client)).resolves.toEqual(USER);
    });
  });

  describe('canActivate', () => {
    const makeContext = (client: AuthenticatedSocket) =>
      ({
        switchToWs: () => ({ getClient: () => client }),
      }) as unknown as ExecutionContext;

    it('short-circuits to true without re-authenticating when client.data.user is already set', async () => {
      const client = makeClient({ data: { user: USER } });

      const result = await guard.canActivate(makeContext(client));

      expect(result).toBe(true);
      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('authenticates and caches the user on the client when not already set', async () => {
      const client = makeClient({ auth: { token: 'valid-token' } });
      jwtService.verify.mockReturnValue({ sub: USER.id, email: USER.email });
      usersService.findById.mockResolvedValue(USER);

      const result = await guard.canActivate(makeContext(client));

      expect(result).toBe(true);
      expect(client.data.user).toEqual(USER);
    });
  });
});
