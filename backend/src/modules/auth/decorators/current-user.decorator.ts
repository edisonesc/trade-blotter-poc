import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUser } from 'src/shared/interface/user.interface';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): IUser => {
    const request = ctx.switchToHttp().getRequest<{ user: IUser }>();
    return request.user;
  },
);
