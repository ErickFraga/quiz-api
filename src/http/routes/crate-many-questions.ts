import { FastifyInstance } from "fastify";
import z from "zod";
import { prisma } from "../../lib/prisma";

export async function createManyQuestions(app: FastifyInstance) {
  app.post("/questions/many", async (request, reply) => {
    const createManyQuestionsRequestBody = z.array(z.object({
      title: z.string(),
      options: z.array(z.string())
    }))
    // console.log(request.body)
    const questionsReq = createManyQuestionsRequestBody.parse(request.body)
    console.log(questionsReq)

    const questions = await questionsReq.map(async ({ title, options }) => ({

      id: (await prisma.question.create({
        data: {
          title,
          options: {
            createMany: {
              data: options.map(option => ({ title: option }))
            }
          }
        }
      })).id
    })
    )


    return reply.status(201).send({ message: `Successfull create ${questions.length} questions`, count: questions.length })

  })
}