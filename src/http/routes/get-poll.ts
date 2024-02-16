import { FastifyInstance } from "fastify"
import z from "zod"
import { prisma } from "../../lib/prisma"
import { redis } from "../../lib/redis"
import { sumScoresFromSet } from "../../utils/sum-set-values"

export async function getPoll (app: FastifyInstance) {
  app.get("/polls/:pollId", async (request, reply) => {
    const getPollParams = z.object({
      pollId: z.string().uuid(),
    })
  
    const {pollId} = getPollParams.parse(request.params)
  
  
    const poll = await prisma.poll.findUnique({
      where:{
        id: pollId
      },
      include: {
        options:{
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if(!poll){
      return reply.status(400).send({message: "Poll not found"})
    }

    const totalVotes = await sumScoresFromSet(pollId)

    const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES')
    const votes = result.reduce((obj, line, index) => {
      if(index %2 ===0){
        const score = result[index + 1]
        Object.assign(obj, { [line]: Number(score)})
        
      }
      return obj
    }, {total: 0} as Record<string, number>)


    return reply.send({
      poll:{
        ...poll,
        totalVotes,
        options: poll.options.map(option => {
          const score = (option.id in votes)? votes[option.id] : 0
          return{
          ...option,
          score,
          percentage: score/totalVotes
        }})
      }
    })
  })
}