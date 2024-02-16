import { FastifyInstance } from "fastify"
import z from "zod"
import { prisma } from "../../lib/prisma"
import { redis } from "../../lib/redis"
import { Poll } from "@prisma/client"
import { getPollVotes } from "../../utils/get-poll-votes"
import { sumScoresFromSet } from "../../utils/sum-set-values"

export async function getPolls (app: FastifyInstance) {
  app.get("/polls", async (_, reply) => {
    
  
  
  
    const polls = await prisma.poll.findMany({
      take: 99,
      include:{
        options:{
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if(!polls){
      return reply.status(400).send({message: "Cant found any poll"})
    }

    
    const parsedPolls = await Promise.all(polls.map(async (poll) => {
      const totalVotes = await sumScoresFromSet(poll.id)
      const {votes} = await getPollVotes(poll.id)

      return {
        ...poll,
        options: poll.options.map(option => {
          const score = (option.id in votes)? votes[option.id] : 0
          return{
          ...option,
          score,
          percentage: score/totalVotes
        }})
      }
    }))

    return reply.send({
      polls:parsedPolls
    })
  })
}