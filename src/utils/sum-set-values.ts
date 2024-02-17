import { prisma } from "../lib/prisma";

export async function sumScoresFromSet(questionId: string) {
  try {
    const answers = await prisma.answer.count({
      where: {
        questionId
      }
    })

    return answers;
  } catch (error) {
    console.error('Error:', error);
    return 0;
  }
}

