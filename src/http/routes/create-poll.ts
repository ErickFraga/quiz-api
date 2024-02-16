import { FastifyInstance } from "fastify";
import z from "zod";
import { prisma } from "../../lib/prisma";

export async function createPoll(app: FastifyInstance) {
  app.post("/polls", async (request, reply) => {
    const createPollRequestBody = z.object({
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

    const { title, options } = createPollRequestBody.parse(request.body);

    const poll = await prisma.poll.create({
      data: {
        title,
        options: {
          createMany: {
            data: options.map((option) => ({ title: option })),
          },
        },
      },
    });
    return reply.status(201).send({ pollId: poll.id });
  });
}
