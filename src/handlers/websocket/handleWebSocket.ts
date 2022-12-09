import { Static, Type } from "@sinclair/typebox";
import { broadcast, onConnect, onDisconnect } from "./connectionHandler";

import { FastifyInstance } from "fastify";
import validateTopicAndToken from "../../infra/validateTopicAndToken";

const WebSocketParams = Type.Object({
  topicName: Type.String(),
});

type WebSocketParamsType = Static<typeof WebSocketParams>;

const WebSocketQuerystring = Type.Object({
  token: Type.String(),
});

type WebSocketQuerystringType = Static<typeof WebSocketQuerystring>;

export default function handleWebSocket(fastify: FastifyInstance) {
  fastify.get<{
    Params: WebSocketParamsType;
    Querystring: WebSocketQuerystringType;
  }>(
    "/:topicName",
    {
      websocket: true,
      schema: {
        summary: "WebSocket access point",
        description: "Connect this endpoint with your accessToken.",
        params: WebSocketParams,
        querystring: WebSocketQuerystring,
      },
    },
    async (connection, request) => {
      const {
        params: { topicName },
        query: { token },
      } = request;
      request.log.trace({ topicName, token }, "Check user token");

      const validated = await validateTopicAndToken(topicName, token);
      if (!validated) {
        request.log.debug({ topicName, token }, "Invalid topic or token");
        connection.socket.close(1001);
        return;
      }

      const { topic } = validated;
      onConnect(topic.id, connection.socket);
      connection.socket
        .on("message", async (message) => {
          await broadcast(topic.id, message.toString("utf-8"));
        })
        .on("close", () => {
          onDisconnect(topic.id, connection.socket);
        });
    }
  );
}
