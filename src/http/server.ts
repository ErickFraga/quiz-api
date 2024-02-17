import fastify from "fastify";
import cookie from "@fastify/cookie"
import websocket from "@fastify/websocket"
import { createQuestion } from "./routes/create-question";
import { getQuestion } from "./routes/get-question";
import { answerQuestion } from "./routes/vote-on-poll";
import { createManyQuestions } from "./routes/crate-many-questions";
import { questionResults } from "./ws/question-results";
import fastifyCors from "@fastify/cors";
import { getQuestions } from "./routes/get-questions";

const app = fastify()

app.register(fastifyCors, {
  origin: "*",
})

app.register(cookie, {
  secret: "quizzz",
  hook: "onRequest",
})

app.register(websocket)

app.register(questionResults)
app.register(createQuestion)
app.register(createManyQuestions)
app.register(getQuestion)
app.register(getQuestions)
app.register(answerQuestion)

app.listen({ port: 3301 }).then(() => {
  console.log("HTTP server running!")
})