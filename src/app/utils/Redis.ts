import { Redis } from "@upstash/redis"

// 👇 we can now import our redis client anywhere we need it
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})