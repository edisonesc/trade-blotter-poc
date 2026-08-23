import 'reflect-metadata';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IUser } from 'src/shared/interface/user.interface';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { findById: jest.Mock };

  const CURRENT_USER: IUser = {
    id: 'user-1',
    email: 'trader@example.com',
    username: 'trader1',
    createdAt: new Date(),
  };

  beforeEach(() => {
    usersService = { findById: jest.fn() };
    controller = new UsersController(usersService as unknown as UsersService);
  });

  describe('me', () => {
    it('delegates to usersService.findById with the current user id and returns its result', async () => {
      usersService.findById.mockResolvedValue(CURRENT_USER);

      const result = await controller.me(CURRENT_USER);

      expect(usersService.findById).toHaveBeenCalledWith(CURRENT_USER.id);
      expect(result).toBe(CURRENT_USER);
    });

    it('is guarded by JwtAuthGuard', () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const target: unknown = UsersController.prototype.me;
      const guards: unknown = Reflect.getMetadata('__guards__', target);
      expect(guards).toContain(JwtAuthGuard);
    });
  });
});
