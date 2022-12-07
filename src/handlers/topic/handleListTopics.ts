import { ErrorResponse, ErrorResponseType } from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import { FastifyInstance } from "fastify";
import TopicResponse from "./models/TopicResponse";
import db from "../../infra/db";
import format from "date-fns/format";

const ListTopicsParams = Type.Object({
  userId: Type.String(),
});

type ListTopicsParamsType = Static<typeof ListTopicsParams>;

const ListTopicsResponse = Type.Object({
  ok: Type.Literal(true),
  result: Type.Array(TopicResponse),
});

type ListTopicsResponseType = Static<typeof ListTopicsResponse>;

export default function handleListTopics(fastify: FastifyInstance) {
  fastify.get<{
    Params: ListTopicsParamsType;
    Reply: ListTopicsResponseType | ErrorResponseType;
  }>(
    "/user/:userId/topic",
    {
      schema: {
        summary: "List topics",
        description: "Show all topics in this user.",
        params: ListTopicsParams,
        response: { 200: ListTopicsResponse, 403: ErrorResponse },
      },
    },
    async (request, reply) => {
      const { userId } = request.params;
      if (
        (await db.user.count({ where: { id: userId, verified: true } })) === 0
      ) {
        request.log.warn({ userId }, "Cannot find user");
        return reply.status(403).send({ error: "Cannot find user" });
      }

      const topics = await db.topic.findMany({
        where: { userId, deleted: false },
      });
      request.log.debug({ userId, topics: topics.length }, "Find all topics");
      return {
        ok: true,
        result: topics.map((topic) => ({
          id: topic.id,
          name: topic.name,
          createdAt: format(topic.createdAt, "yyyy-MM-dd HH:mm:ss"),
        })),
      };
    }
  );
}
