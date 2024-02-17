import { FastifyInstance } from "fastify";
import z from "zod";
import { prisma } from "../../lib/prisma";

export async function createQuestion(app: FastifyInstance) {
  app.post("/questions", async (request, reply) => {
    const createQuestionRequestBody = z.object({
      title: z.string().min(3, { message: "O titulo precisa ter no mínimo 3 caracteres!" }),
      options: z
        .array(
          z
            .string()
            .min(1, { message: "A Opção precisa ter pelo menos uma letra!" })
        )
        .min(2, { message: "Uma Enquete precisa ter pelo menos 2 alternativas!" })
        .max(10, { message: "Uma Enquete pode ter no máximo 10 alternativas!" }),
    });

    const { title, options } = createQuestionRequestBody.parse(request.body);

    const question = await prisma.question.create({
      data: {
        title,
        options: {
          createMany: {
            data: options.map((option) => ({ title: option })),
          },
        },
      },
    });
    return reply.status(201).send({ questionId: question.id });
  });
}
