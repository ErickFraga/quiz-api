import { FastifyInstance } from "fastify";
import { request } from "http";
import z from "zod";
import { prisma } from "../../lib/prisma";

export async function createManyPolls(app:FastifyInstance) {
  app.post("/many-polls", async (request,reply)=> {
    const createManyPollsRequestBody = z.array(z.object({
      title: z.string(),
      options: z.array(z.string())
    }))

    const pollsReq = createManyPollsRequestBody.parse(request.body)
      
    const polls = await pollsReq.map(async({title, options}) =>  ({
      
      id:(await prisma.poll.create({
      data:{
        title,
        options: {
          createMany: {
            data: options.map(option => ({title: option}))
          }
        }
      }
    })).id  
  })
  )


    return reply.status(201).send({message: `Successfull create ${polls.length} polls`, count:polls.length})

  })
}