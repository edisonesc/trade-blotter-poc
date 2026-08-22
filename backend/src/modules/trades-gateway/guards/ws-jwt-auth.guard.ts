import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/users.service';
import { IUser } from 'src/shared/interface/user.interface';
import { AuthenticatedSocket } from '../trades-gateway.types';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();

    if (client.data.user) return true;

    client.data.user = await this.authenticate(client);
    return true;
  }

  async authenticate(client: AuthenticatedSocket): Promise<IUser> {
    const token = this.extractToken(client);
    if (!token) throw new UnauthorizedException('Missing token');

    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify<{ sub: string; email: string }>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();

    return user;
  }

  extractToken(client: AuthenticatedSocket): string | undefined {
    const authToken = client.handshake.auth?.token as string | undefined;
    if (authToken) return authToken;

    const header = client.handshake.headers?.authorization;
    if (header?.startsWith('Bearer ')) return header.slice(7);

    return undefined;
  }
}
