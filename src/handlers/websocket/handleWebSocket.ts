import { Static, Type } from "@sinclair/typebox";
import { broadcast, onConnect, onDisconnect } from "./connectionHandler";

import AccessTokenPayload from "../../models/AccessTokenPayload";
import { FastifyInstance } from "fastify";
import db from "../../infra/db";

const WebSocketQuerystring = Type.Object({
  accessToken: Type.String(),
});

type WebSocketQuerystringType = Static<typeof WebSocketQuerystring>;

export default function handleWebSocket(fastify: FastifyInstance) {
  fastify.get<{ Querystring: WebSocketQuerystringType }>(
    "/",
    {
      websocket: true,
      schema: {
        summary: "WebSocket access point",
        description: "Connect this endpoint with your accessToken.",
        querystring: WebSocketQuerystring,
      },
    },
    async (connection, request) => {
      const { accessToken } = request.query;
      request.log.trace({ accessToken }, "Check access token");

      const { topicId } = fastify.jwt.verify<AccessTokenPayload>(accessToken);
      const topic = await db.topic.findFirst({ where: { id: topicId } });
      if (!topic) {
        request.log.debug({ topicId }, "Cannot find topic");
        connection.socket.close(1001);
        return;
      }
      if (topic.deleted) {
        request.log.debug(
          { topicId },
          "Cannot connect to already deleted topic"
        );
        connection.socket.close(1001);
        return;
      }

      onConnect(topicId, connection.socket);
      connection.socket
        .on("message", async (message) => {
          await broadcast(topicId, message.toString("utf-8"));
        })
        .on("close", () => {
          onDisconnect(topicId, connection.socket);
        });
    }
  );
}
