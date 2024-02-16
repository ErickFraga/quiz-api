import { Poll } from "@prisma/client";
import { redis } from "../lib/redis";
import { prisma } from "../lib/prisma";

export async function getPollVotes(pollId: string) {
  const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES')
    
  const votes = result.reduce((obj, line, index) => {
    if(index %2 ===0){
      const score = result[index + 1]
      Object.assign(obj, { [line]: score})
    }
    return obj
  }, {} as Record<string, number>)
  return {votes}
}