import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dtos/register-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RequestWithUser } from './interfaces';
import { JwtAuthService } from './jwt-auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    const { uid, email } = await this.authService.register({ ...registerUser });
    return { uid, email };
  }

  @Post('login')
  async login(@Body() loginUser: LoginUserDto) {
    const user = await this.authService.authenticate({ ...loginUser });
    const token = this.jwtAuthService.generateToken(user);
    return { token };
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh(@Request() req: RequestWithUser) {
    const token = this.jwtAuthService.generateToken(req.user);
    return { token };
  }

  @Post('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }
}
