import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_WEIGHT = 'rateLimitWeight';
export const RateLimit = ({ weight }: { weight: number }) =>
  SetMetadata(RATE_LIMIT_WEIGHT, weight ?? 1);
