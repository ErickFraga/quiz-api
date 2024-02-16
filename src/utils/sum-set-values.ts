import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

export async function sumScoresFromSet(pollId:string) {
  try {
    const votes = await prisma.vote.count({
      where:{
        pollId
      }
    })

    return votes;
  } catch (error) {
    console.error('Error:', error);
    return 0;
  } 
}

