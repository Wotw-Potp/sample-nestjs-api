import type { JwtPayload } from './jwt-payload';

export { JwtPayload };

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
