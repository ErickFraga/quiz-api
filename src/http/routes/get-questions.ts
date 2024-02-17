import { FastifyInstance } from "fastify"
import { prisma } from "../../lib/prisma"
import { getQuestionAnswersStats } from "../../utils/get-question-answers-count"
import { sumScoresFromSet } from "../../utils/sum-set-values"

export async function getQuestions(app: FastifyInstance) {
  app.get("/questions", async (_, reply) => {

    const questions = await prisma.question.findMany({
      take: 99,
      include: {
        options: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!questions) {
      return reply.status(400).send({ message: "Cant found any question" })
    }


    const parsedQuestions = await Promise.all(questions.map(async (question) => {
      const totalAnswers = await sumScoresFromSet(question.id)
      const answers = await getQuestionAnswersStats(question.id)

      return {
        ...question,
        options: question.options.map(option => {
          const score = (option.id in answers) ? answers[option.id] : 0
          return {
            ...option,
            score,
            percentage: score / totalAnswers
          }
        })
      }
    }))

    return reply.send({
      questions: parsedQuestions
    })
  })
}