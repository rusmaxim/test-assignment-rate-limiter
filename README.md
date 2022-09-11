## How to start

* rename .env.example with .env
* `npm start`
* login with {"username": "test", "password": "test"} '/auth/login' to receive JWT token

## Endpoints

* /public, /auth/login are public set with @Public decorator
* All others endpoints private by default with weight (/private, /profile, ...)
* /private5 is private endpoint with rate limiter weight 5

## Headers for rate limiter

* 'X-RateLimit-Remaining' - remaining amount of requests
* 'X-RateLimit-Limit' - limit for current request type
* 'X-RateLimit-Weight' - weight of current request
* 'X-RateLimit-ResetIn' - Date and time when limit will be completely reset
* 'X-RateLimit-RetryNext' - Date and time when there will be capacity for current request, sent only on limit hit

## Posible optimizations

* * It's possible to have overlimit between zrangebyscore and zadd commands. Could be resolved by locking to write. 
* * don't store each request but only counts for intervals - sliding window instead sliding log (could be useful for big limits)
