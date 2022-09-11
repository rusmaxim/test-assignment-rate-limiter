import { Controller, Request, Get, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';
import { Public } from './auth/public.decorator';
import { RateLimit } from './rate-limit/rate-limit.decorator';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @Get('public')
  getPublic() {
    return 'This is public';
  }

  @Get('private')
  getPrivate() {
    return 'This is private';
  }

  @Get('private5')
  @RateLimit({ weight: 5 })
  getPrivate5() {
    return 'This is private with rate limit weight 5';
  }
}
