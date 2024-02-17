import { FastifyInstance } from "fastify"
import { randomUUID } from "node:crypto"
import z from "zod"
import { prisma } from "../../lib/prisma"
import { redis } from "../../lib/redis"
import { answering } from "../../utils/answering-pub-sup"
import { getQuestionAnswersStats } from "../../utils/get-question-answers-count"
import { sumScoresFromSet } from "../../utils/sum-set-values"

export async function answerQuestion(app: FastifyInstance) {
  app.post("/questions/:questionId/answer", async (request, reply) => {

    const answerQuestionParams = z.object({
      questionId: z.string().uuid(),
    })

    const answerQuestionBody = z.object({
      questionOptionId: z.string().uuid(),
    })

    const { questionId } = answerQuestionParams.parse(request.params)
    const { questionOptionId } = answerQuestionBody.parse(request.body)
    const totalAnswers = await sumScoresFromSet(questionId)


    let sessionId = request.ip
    console.log(request.ip)
    if (sessionId) {
      const userPreviousAnswer = await prisma.answer.findUnique({
        where: {
          sessionId_questionId: {
            sessionId,
            questionId,
          },
        },
      })

      if (userPreviousAnswer && userPreviousAnswer.questionOptionId !== questionOptionId) {

        await prisma.answer.delete({
          where: {
            id: userPreviousAnswer.id
          }
        })
        const hasAnswered = await redis.zincrby(questionId, -1, userPreviousAnswer.questionOptionId)
        const answers = await getQuestionAnswersStats(questionId)
        answering.publish(questionId, {
          answers: Object.keys(answers).map((key) => ({
            answersCount: answers[key],
            percentage: answers[key] / totalAnswers,
            questionOptionId: key
          }))
        })

      } else if (userPreviousAnswer) {
        return reply.status(400).send({ message: 'You already answered this question.' })
      }
    }

    if (!sessionId) {
      sessionId = randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        signed: true,
        httpOnly: true
      })
    }

    await prisma.answer.create({
      data: {
        sessionId,
        questionId,
        questionOptionId
      }
    })

    const hasAnswered = await redis.zincrby(questionId, 1, questionOptionId)
    const answers = await getQuestionAnswersStats(questionId)
    answering.publish(questionId, {
      answers: Object.keys(answers).map((key) => ({
        answersCount: answers[key],
        percentage: answers[key] / totalAnswers,
        questionOptionId: key
      }))
    })

    return reply.status(201).send({ sessionId })
  })
}