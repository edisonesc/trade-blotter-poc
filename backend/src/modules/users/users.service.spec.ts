import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
  };

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };
    service = new UsersService(prisma as unknown as PrismaService);
  });

  describe('findById', () => {
    it('selects only non-sensitive fields, excluding the password hash', async () => {
      const user = {
        id: 'user-1',
        email: 'trader@example.com',
        username: 'trader1',
        createdAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findById('user-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true, email: true, username: true, createdAt: true },
      });
      const calls = prisma.user.findUnique.mock.calls as Array<
        [{ select: Record<string, boolean> }]
      >;
      const [[firstCallArgs]] = calls;
      expect(firstCallArgs.select.password).toBeUndefined();
      expect(result).toEqual(user);
    });
  });

  describe('findByEmail', () => {
    it('passes through to prisma.user.findUnique by email', async () => {
      const user = { id: 'user-1', email: 'trader@example.com' };
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findByEmail('trader@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'trader@example.com' },
      });
      expect(result).toEqual(user);
    });
  });

  describe('create', () => {
    it('creates a user with the given hashed password', async () => {
      const created = {
        id: 'user-1',
        email: 'trader@example.com',
        username: 'trader1',
        password: 'hashed-password',
      };
      prisma.user.create.mockResolvedValue(created);

      const result = await service.create(
        'trader@example.com',
        'trader1',
        'hashed-password',
      );

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'trader@example.com',
          username: 'trader1',
          password: 'hashed-password',
        },
      });
      expect(result).toEqual(created);
    });
  });
});
