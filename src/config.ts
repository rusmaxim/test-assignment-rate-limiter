export default () => ({
  redis: {
    url: process.env.REDIS_URL,
  },
  rateLimit: {
    PUBLIC: {
      limit: parseInt(process.env.RATE_LIMIT_PUBLIC_LIMIT, 10),
      windowInSeconds: parseInt(
        process.env.RATE_LIMIT_PUBLIC_WINDOW_IN_SECONDS,
        10,
      ),
    },
    PRIVATE: {
      limit: parseInt(process.env.RATE_LIMIT_PRIVATE_LIMIT, 10),
      windowInSeconds: parseInt(
        process.env.RATE_LIMIT_PRIVATE_WINDOW_IN_SECONDS,
        10,
      ),
    },
  },
});
