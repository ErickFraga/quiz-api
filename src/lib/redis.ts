import { Redis } from "ioredis";

export const redis = new Redis({
  path: process.env.REDIS_PATH,
})