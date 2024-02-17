import { FastifyInstance } from "fastify";
import z from "zod";
import { answering } from "../../utils/answering-pub-sup";

export async function questionResults(app: FastifyInstance) {
  app.get('/question/:questionId/results',
    { websocket: true },
    (connection, request) => {
      const getQuestionParams = z.object({
        questionId: z.string().uuid(),
      })

      const { questionId } = getQuestionParams.parse(request.params)

      answering.subscribe(questionId, (message) => {
        connection.socket.send(JSON.stringify(message))
      })
    }
  )
}