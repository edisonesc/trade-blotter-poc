import 'reflect-metadata';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { register: jest.Mock; login: jest.Mock };

  beforeEach(() => {
    authService = { register: jest.fn(), login: jest.fn() };
    controller = new AuthController(authService as unknown as AuthService);
  });

  describe('register', () => {
    it('delegates to authService.register with email, username, password and returns its result', async () => {
      const dto: RegisterDTO = {
        email: 'trader@example.com',
        username: 'trader1',
        password: 'password123',
      };
      const expected = { accessToken: 'token' };
      authService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(
        dto.email,
        dto.username,
        dto.password,
      );
      expect(result).toBe(expected);
    });
  });

  describe('login', () => {
    it('delegates to authService.login with email, password and returns its result', async () => {
      const dto: LoginDTO = {
        email: 'trader@example.com',
        password: 'password123',
      };
      const expected = { accessToken: 'token' };
      authService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toBe(expected);
    });
  });
});
