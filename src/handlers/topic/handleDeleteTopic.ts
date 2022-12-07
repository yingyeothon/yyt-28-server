import {
  ErrorResponse,
  OkResponseType,
  SuccessResponse,
} from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import { FastifyInstance } from "fastify";
import db from "../../infra/db";
import { disconnectAll } from "../websocket/connectionHandler";

const DeleteTopicParams = Type.Object({
  userId: Type.String(),
  topicName: Type.String(),
});

type DeleteTopicParamsType = Static<typeof DeleteTopicParams>;

export default function handleDeleteTopic(fastify: FastifyInstance) {
  fastify.delete<{ Params: DeleteTopicParamsType; Reply: OkResponseType }>(
    "/user/:userId/topic/:topicName",
    {
      schema: {
        summary: "Delete topic",
        description:
          "Delete a topic and disconnect all connections in that topic.",
        params: DeleteTopicParams,
        response: { 200: SuccessResponse, 400: ErrorResponse },
      },
    },
    async (request, reply) => {
      const { userId, topicName } = request.params;
      if (
        (await db.user.count({ where: { id: userId, verified: true } })) === 0
      ) {
        request.log.warn({ userId }, "Cannot find user");
        return reply.status(403).send({ error: "Cannot find user" });
      }

      const maybe = await db.topic.findFirst({
        where: { userId, name: topicName, deleted: false },
      });
      if (!maybe) {
        return reply
          .status(400)
          .send({ error: `Cannot find topic by name: [${topicName}]` });
      }
      await db.topic.update({
        data: { deleted: true },
        where: { id: maybe.id },
      });
      request.log.info({ userId, topicName }, "Delete topic");

      request.log.info({ userId, topicName }, "Delete all connections");
      disconnectAll(maybe.id);

      return { ok: true };
    }
  );
}
