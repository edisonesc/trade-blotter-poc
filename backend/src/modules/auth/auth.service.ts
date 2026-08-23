import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { comparePassword, hashPassword } from 'src/shared/utils/bcrypt.util';
import { IAuthPayload } from './interfaces/auth-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, username: string, password: string) {
    const doesEmailExist = await this.usersService.findByEmail(email);
    if (doesEmailExist) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await hashPassword(password);
    const user = await this.usersService.create(
      email,
      username,
      hashedPassword,
    );
    return this.issueToken(user);
  }

  async login(email: string, passowrd: string) {
    const user = await this.validateUser(email, passowrd);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueToken(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const doesPasswordMatch = await comparePassword(password, user.password);
    return doesPasswordMatch ? user : null;
  }

  private issueToken(user: IAuthPayload) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
