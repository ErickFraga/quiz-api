import { redis } from "../lib/redis";

export async function getQuestionAnswersStats(questionId: string) {
  const result = await redis.zrange(questionId, 0, -1, 'WITHSCORES')

  const answers = result.reduce((obj, line, index) => {
    if (index % 2 === 0) {
      const score = result[index + 1]
      Object.assign(obj, { [line]: score })
    }
    return obj
  }, {} as Record<string, number>)
  return answers
}