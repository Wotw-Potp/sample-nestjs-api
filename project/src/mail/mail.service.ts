import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private logger = new Logger('MailService');

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmailVerification(
    to: string,
    args: { name: string; token: string },
  ) {
    try {
      const info = await this.mailerService.sendMail({
        to,
        subject: 'Email Verification',
        template: 'user/email-verification',
        context: {
          ...args,
          verificationUrl: `${this.configService.get('CLIENT_APP_URL')}/auth/verify-email?token=${args.token}`,
        },
      });
      this.logger.log(info);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async sendEmailVerified(to: string, args: { name: string }) {
    try {
      const info = await this.mailerService.sendMail({
        to,
        subject: 'Email Verified',
        template: 'user/email-verified',
        context: args,
      });
      this.logger.log(info);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async testMail(name = 'sample') {
    try {
      const info = await this.mailerService.sendMail({
        to: 'test@example.com',
        subject: 'Test Mail',
        template: 'test',
        context: {
          name,
        },
      });
      console.log(info);
    } catch (error) {
      console.error(error);
    }
  }
}
