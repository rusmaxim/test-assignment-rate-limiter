import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { ConfigService } from '@nestjs/config';

const PREFIX = 'ratelimiter::';

export type LIMIT_TYPE = 'PUBLIC' | 'PRIVATE';

export type RateLimitResponse = {
  limitReached: boolean;
  limit: number;
  weight: number;
  remaining: number;
  resetInTimestamp: number;
  retryNextTimestamp?: number;
};

export type RateLimitConfig = {
  limit: number;
  windowInSeconds: number;
};

const yeet = (message) => {
  throw new Error(message);
};

@Injectable()
export class RateLimitService {
  private limits: Record<LIMIT_TYPE, RateLimitConfig>;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.limits = this.configService.getOrThrow('rateLimit');
  }

  async checkLimit({
    limitType,
    key,
    weight,
  }: {
    limitType: LIMIT_TYPE;
    key: string;
    weight: number;
  }): Promise<RateLimitResponse> {
    const client = await this.redisService.getClient();

    const redisKey = this.getRedisKey(key);
    const now = Date.now();

    const limitConfig: RateLimitConfig =
      this.limits[limitType] ??
      yeet(`Limit config is not set for ${limitType}`);

    const { limit, windowInSeconds } = limitConfig;

    await client.zremrangebyscore(
      redisKey,
      0,
      Math.ceil(now - windowInSeconds * 1000),
    );

    const sentRangeByScore = await client.zrangebyscore(redisKey, 0, now);

    const weightedLimit = limit - weight;

    if (sentRangeByScore.length >= weightedLimit) {
      const retryElement =
        sentRangeByScore[sentRangeByScore.length - weightedLimit];
      const lastElement = sentRangeByScore[sentRangeByScore.length - 1];
      return {
        limitReached: true,
        limit,
        weight,
        remaining: limit - sentRangeByScore.length,
        resetInTimestamp:
          parseInt(lastElement.split(':')[0], 10) + windowInSeconds * 1000,
        retryNextTimestamp:
          parseInt(retryElement.split(':')[0], 10) + windowInSeconds * 1000,
      };
    }

    const scores = [...Array(weight)].flatMap(() => [
      now,
      `${now}:${uuidv4()}`,
    ]);

    await client.zadd(redisKey, ...scores);
    await client.expire(redisKey, windowInSeconds);

    return {
      limitReached: false,
      limit,
      weight,
      remaining: limit - sentRangeByScore.length - weight,
      resetInTimestamp: now + windowInSeconds * 1000,
    };
  }

  getRedisKey(key: string) {
    return `${PREFIX}:${key}`;
  }
}
