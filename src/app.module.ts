import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersService } from './users/users.service';
import { UsersModule } from './users/users.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import config from './config';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    RateLimitModule,
    ConfigModule.forRoot({
      load: [config],
    }),
  ],
  controllers: [AppController],
  providers: [UsersService],
})
export class AppModule {}
