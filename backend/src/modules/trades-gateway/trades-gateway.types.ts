import { Socket } from 'socket.io';
import { IUser } from 'src/shared/interface/user.interface';

export interface WsData {
  user?: IUser;
}

export type AuthenticatedSocket = Socket<any, any, any, WsData>;
