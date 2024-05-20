import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dtos/register-user.dto';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { hash, compare } from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { LoginUserDto } from './dtos/login-user.dto';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async register({ email, name, password }: RegisterUserDto) {
    // Check if the user already exists
    const existUser = await this.userRepository.findOneBy({ email });
    // If the user exists, throw an error
    if (existUser) {
      throw new BadRequestException();
    }

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // If the user does not exist, create a new user
      const user = await queryRunner.manager.save(
        this.userRepository.create({
          email,
          name,
          password: await hash(password, 12),
        }),
      );

      // Generate a email verification token
      const token = Buffer.from([user.uid, user.email].join(':')).toString(
        'base64',
      );
      // Send a confirmation email
      await this.mailService.sendEmailVerification(user.email, {
        name: user.name,
        token,
      });
      // Commit the transaction
      await queryRunner.commitTransaction();
      // Return the user
      return user;
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async verifyEmail(token: string) {
    const [uid, email] = Buffer.from(token, 'base64')
      .toString('utf8')
      .split(':');

    // Find the user by uid
    const user = await this.userRepository.findOneBy({ uid });
    // If the user does not exist, throw an error
    if (!user || user.email !== email) {
      throw new BadRequestException();
    }
    // If the user's email is already verified, throw an error
    if (user.emailVerifiedAt) {
      throw new ServiceUnavailableException();
    }

    // Update the user's email verification status
    user.emailVerifiedAt = new Date();

    try {
      // Save the user
      await this.userRepository.save(user, { reload: true });
      // Send a welcome email
      await this.mailService.sendEmailVerified(user.email, {
        name: user.name,
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  async authenticate({ email, password }: LoginUserDto) {
    // Find the user by email
    const user = await this.userRepository.findOneBy({ email });
    // If the user does not exist, throw an error
    if (!user) {
      throw new BadRequestException();
    }
    // If the password does not match, throw an error
    if (!(await compare(password, user.password))) {
      throw new UnauthorizedException();
    }
    // Update the user's last login date
    user.lastLogin = new Date();
    // Save the user
    await this.userRepository.save(user, { reload: true });
    // Return the user
    return user;
  }
}
