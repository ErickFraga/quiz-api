import fastify from "fastify";
import cookie from "@fastify/cookie"
import websocket from "@fastify/websocket"
import { createPoll } from "./routes/create-poll";
import { getPoll } from "./routes/get-poll";
import { voteOnPoll } from "./routes/vote-on-poll";
import { createManyPolls } from "./routes/crate-many-polls";
import { pollResults } from "./ws/poll-results";
import fastifyCors from "@fastify/cors";
import { getPolls } from "./routes/get-polls";

const app = fastify()

app.register(fastifyCors, {
  origin: "*",
})

app.register(cookie, {
  secret: "polls-app-nlw",
  hook: "onRequest",
})

app.register(websocket)

app.register(pollResults)
app.register(createPoll)
app.register(createManyPolls)
app.register(getPoll)
app.register(getPolls)
app.register(voteOnPoll)

app.listen({port: 3301}).then(() => {
  console.log("HTTP server running!")
})