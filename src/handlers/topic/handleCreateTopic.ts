import { ErrorResponse, ErrorResponseType } from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import { FastifyInstance } from "fastify";
import { Topic } from "@prisma/client";
import TopicResponse from "./models/TopicResponse";
import db from "../../infra/db";
import format from "date-fns/format";
import { maxTopicCount } from "../../infra/config";
import { serializeError } from "serialize-error";

const CreateTopicParams = Type.Object({
  userId: Type.String(),
});

type CreateTopicParamsType = Static<typeof CreateTopicParams>;

const CreateTopicBody = Type.Object({
  name: Type.String(),
});

type CreateTopicBodyType = Static<typeof CreateTopicBody>;

const CreateTopicResponse = Type.Object({
  ok: Type.Literal(true),
  result: TopicResponse,
});

type CreateTopicResponseType = Static<typeof CreateTopicResponse>;

export default function handleCreateTopic(fastify: FastifyInstance) {
  fastify.post<{
    Params: CreateTopicParamsType;
    Body: CreateTopicBodyType;
    Reply: CreateTopicResponseType | ErrorResponseType;
  }>(
    "/user/:userId/topic",
    {
      schema: {
        summary: "Create topic",
        description: "Create a new topic in the user.",
        params: CreateTopicParams,
        body: CreateTopicBody,
        response: {
          200: CreateTopicResponse,
          400: ErrorResponse,
          429: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const {
        body: { name },
        params: { userId },
      } = request;
      if (!name) {
        request.log.debug({ name, userId }, "No 'name' in request body");
        return reply
          .send({
            error: `Please send topic name via request body like {"name":"topic-name"}`,
          })
          .status(400);
      }

      if (
        (await db.user.count({ where: { id: userId, verified: true } })) === 0
      ) {
        request.log.warn({ userId }, "Cannot find user");
        return reply.status(403).send({ error: "Cannot find user" });
      }

      if ((await db.topic.count({ where: { userId } })) > maxTopicCount) {
        request.log.debug({ name, userId }, "Too many alive topics");
        return reply.status(429).send({ error: "Too many alive topics" });
      }

      try {
        const newTopic: Topic = await db.topic.create({
          data: {
            userId: request.params.userId,
            name: request.body.name,
            deleted: false,
          },
        });
        request.log.info(
          { userId, topic: newTopic.name, topicId: newTopic.id },
          "Create topic"
        );
        return {
          ok: true,
          result: {
            id: newTopic.id,
            name: newTopic.name,
            createdAt: format(newTopic.createdAt, "yyyy-MM-dd HH:mm:ss"),
          },
        };
      } catch (error: any) {
        if (/Unique constraint failed/.test(error.message)) {
          request.log.warn(
            { name, error: serializeError(error) },
            "Maybe topic name is duplicate"
          );
          return reply.status(400).send({ error: "Duplicate topic name" });
        }
        request.log.error(
          { name, error: serializeError(error) },
          "Cannot create topic"
        );
        return reply
          .status(500)
          .send({ error: "Error occurred from database" });
      }
    }
  );
}
