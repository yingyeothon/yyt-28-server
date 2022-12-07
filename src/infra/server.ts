import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyWebSocket from "@fastify/websocket";

const server = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
})
  .withTypeProvider<TypeBoxTypeProvider>()
  .register(fastifyWebSocket, { logLevel: "trace" })
  .register(fastifyCookie)
  .register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
  })
  .register(fastifySwagger)
  .register(fastifySwaggerUi, {
    routePrefix: "/_docs",
  })
  .register(fastifyRateLimit, { global: true, max: 100, timeWindow: 1000 })
  .register(async function (fastify) {
    fastify.setNotFoundHandler(
      {
        preHandler: fastify.rateLimit({
          max: 5,
          timeWindow: 1000,
        }),
      },
      function (_, reply) {
        reply.status(404).send({ error: "Not Found" });
      }
    );
  });

export default server;
