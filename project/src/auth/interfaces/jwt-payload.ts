import { User } from 'src/user/entities/user.entity';

export interface JwtPayload {
  uid: User['uid'];
}
