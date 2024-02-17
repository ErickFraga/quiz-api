import { FastifyInstance } from "fastify"
import z from "zod"
import { prisma } from "../../lib/prisma"
import { redis } from "../../lib/redis"
import { sumScoresFromSet } from "../../utils/sum-set-values"

export async function getQuestion(app: FastifyInstance) {
  app.get("/questions/:questionId", async (request, reply) => {
    const getQuestionParams = z.object({
      questionId: z.string().uuid(),
    })

    const { questionId } = getQuestionParams.parse(request.params)


    const question = await prisma.question.findUnique({
      where: {
        id: questionId
      },
      include: {
        options: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!question) {
      return reply.status(400).send({ message: "Question not found" })
    }

    const totalAnswers = await sumScoresFromSet(questionId)

    const result = await redis.zrange(questionId, 0, -1, 'WITHSCORES')
    const answers = result.reduce((obj, line, index) => {
      if (index % 2 === 0) {
        const score = result[index + 1]
        Object.assign(obj, { [line]: Number(score) })

      }
      return obj
    }, { total: 0 } as Record<string, number>)


    return reply.send({
      question: {
        ...question,
        totalAnswers,
        options: question.options.map(option => {
          const score = (option.id in answers) ? answers[option.id] : 0
          return {
            ...option,
            score,
            percentage: score / totalAnswers
          }
        })
      }
    })
  })
}