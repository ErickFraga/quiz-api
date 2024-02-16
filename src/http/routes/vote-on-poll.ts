import { FastifyInstance } from "fastify"
import z from "zod"
import {randomUUID} from "node:crypto"
import { prisma } from "../../lib/prisma"
import { redis } from "../../lib/redis"
import { voting } from "../../utils/voting-pu-sup"
import { sumScoresFromSet } from "../../utils/sum-set-values"
import { get } from "node:http"
import { getPollVotes } from "../../utils/get-poll-votes"

export async function voteOnPoll (app: FastifyInstance) {
  app.post("/polls/:pollId/vote", async (request, reply) => {
    
    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    })

    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid(),
    })
  
    const {pollId} = voteOnPollParams.parse(request.params)
    const {pollOptionId} = voteOnPollBody.parse(request.body)
    const totalVotes = await sumScoresFromSet(pollId)


    let sessionId  = request.ip
    console.log(request.ip)
    if(sessionId) {
      const userPreviousVoteOnPoll = await prisma.vote.findUnique({
        where:{
          sessionId_pollId:{
            sessionId,
            pollId
          },
        },
      })

      if(userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId !== pollOptionId){

        await prisma.vote.delete({
          where: {
            id:  userPreviousVoteOnPoll.id
          }
        })
        const hasVote = await redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId)
        const {votes} = await getPollVotes(pollId)
        voting.publish(pollId, {
          votes: Object.keys(votes).map((key) => ({
            votes: votes[key], 
            percentage: votes[key]/totalVotes,
            pollOptionId: key}))})

      } else if(userPreviousVoteOnPoll){
        return reply.status(400).send({message: 'You already vote on this poll.'})
      }
    }

    if(!sessionId){
      sessionId = randomUUID()
      
      reply.setCookie('sessionId', sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        signed: true,
        httpOnly: true
      })
    }

    await prisma.vote.create({
      data:{
        sessionId,
        pollId,
        pollOptionId
      }
    })

    const hasVoted = await redis.zincrby(pollId, 1, pollOptionId)
    const {votes} = await getPollVotes(pollId)
    voting.publish(pollId, {
      votes: Object.keys(votes).map((key) => ({
        votes: votes[key], 
        percentage: votes[key]/totalVotes,
        pollOptionId: key}))})

    return reply.status(201).send({sessionId})
  })
}