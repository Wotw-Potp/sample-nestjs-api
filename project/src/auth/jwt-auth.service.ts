import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { JwtPayload } from './interfaces';

@Injectable()
export class JwtAuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken({ uid }: Partial<User>) {
    const payload: JwtPayload = { uid };
    return this.jwtService.sign(payload);
  }
}
