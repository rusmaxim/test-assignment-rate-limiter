import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions';
import { HttpStatus } from '@nestjs/common/enums';
import { Reflector } from '@nestjs/core';
import { ExtractJwt } from 'passport-jwt';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from 'src/auth/public.decorator';
import { RateLimitResponse, RateLimitService } from './rate-limit.service';
import { RATE_LIMIT_WEIGHT } from './rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const rateLimitWeight =
      this.reflector.getAllAndOverride<number | undefined>(RATE_LIMIT_WEIGHT, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 1;

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return this.checkLimit(request, response, isPublic, rateLimitWeight);
  }

  async checkLimit(request: any, response: any, isPublic: boolean, weight = 1) {
    let rateLimitResponse: RateLimitResponse;
    if (isPublic) {
      const ip = request.ips.length ? request.ips[0] : request.ip;
      if (!ip) {
        throw new HttpException({}, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      rateLimitResponse = await this.rateLimitService.checkLimit({
        limitType: 'PUBLIC',
        key: ip,
        weight,
      });
    } else {
      const jwtToken = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
      rateLimitResponse = await this.rateLimitService.checkLimit({
        limitType: 'PRIVATE',
        key: jwtToken.toString(),
        weight,
      });
    }

    response.header('X-RateLimit-Remaining', rateLimitResponse.remaining);
    response.header('X-RateLimit-Limit', rateLimitResponse.limit);
    response.header('X-RateLimit-Weight', rateLimitResponse.weight);
    response.header(
      'X-RateLimit-ResetIn',
      new Date(rateLimitResponse.resetInTimestamp).toTimeString(),
    );
    if (rateLimitResponse.limitReached) {
      response.header(
        'X-RateLimit-RetryNext',
        new Date(rateLimitResponse.retryNextTimestamp).toTimeString(),
      );
      throw new HttpException(
        {
          message: 'Too many requests',
          limit: rateLimitResponse.limit,
          retryNext: new Date(
            rateLimitResponse.retryNextTimestamp,
          ).toTimeString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
