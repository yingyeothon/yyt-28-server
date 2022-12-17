import { ErrorResponse, ErrorResponseType } from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import { FastifyInstance } from "fastify";
import { Message } from "@prisma/client";
import db from "../../infra/db";
import format from "date-fns/format";
import { maxMessageFetchCount } from "../../infra/config";
import validateTopicAndToken from "../../infra/validateTopicAndToken";

enum FetchDirection {
  asc = "asc",
  desc = "desc",
}

const FetchMessageParams = Type.Object({
  topicName: Type.String(),
});

type FetchMessageParamsType = Static<typeof FetchMessageParams>;

const FetchMessageQuerystring = Type.Object({
  token: Type.Optional(Type.String()),
  messageId: Type.Optional(Type.String()),
  count: Type.Optional(Type.Number()),
  dir: Type.Optional(Type.Enum(FetchDirection)),
});

type FetchMessageQuerystringType = Static<typeof FetchMessageQuerystring>;

const FetchMessageHeaders = Type.Object({
  "x-token": Type.Optional(Type.String()),
});

type FetchMessageHeadersType = Static<typeof FetchMessageHeaders>;

const FetchMessageCookies = Type.Object({
  token: Type.Optional(Type.String()),
});

type FetchMessageCookiesType = Static<typeof FetchMessageCookies>;

const FetchMessageResponse = Type.Object({
  ok: Type.Literal(true),
  result: Type.Array(
    Type.Object({
      id: Type.String(),
      body: Type.String(),
      createdAt: Type.String(),
    })
  ),
});

type FetchMessageResponseType = Static<typeof FetchMessageResponse>;

export default function handleFetchMessages(fastify: FastifyInstance) {
  fastify.get<{
    Params: FetchMessageParamsType;
    Querystring: FetchMessageQuerystringType;
    Headers: FetchMessageHeadersType;
    Cookies: FetchMessageCookiesType;
    Reply: FetchMessageResponseType | ErrorResponseType;
  }>(
    "/message/:topicName",
    {
      schema: {
        summary: "Fetch messages",
        description: "Fetch messages in the topic from the message id.",
        params: FetchMessageParams,
        querystring: FetchMessageQuerystring,
        headers: FetchMessageHeaders,
        response: {
          200: FetchMessageResponse,
          400: ErrorResponse,
          401: ErrorResponse,
          413: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const { cookies, headers, query } = request;
      const token = cookies.token ?? headers["x-token"] ?? query.token;
      if (!token) {
        request.log.debug(
          { cookies, headers, query },
          "Cannot find user token"
        );
        return reply.status(400).send({
          error: "Cannot find user token. Please use 'token' query parameter",
        });
      }
      const validated = await validateTopicAndToken(
        request.params.topicName,
        token
      );
      if (!validated) {
        return reply.status(401).send({
          error: "Invalid topic or user token",
        });
      }

      const { topic } = validated;
      const {
        query: { messageId = "", count = 10, dir = "asc" },
      } = request;
      if (!["asc", "desc"].includes(dir)) {
        return reply
          .status(400)
          .send({ error: "'dir' should be one of 'asc' and 'desc'" });
      }
      if (count > maxMessageFetchCount) {
        return reply.status(413).send({
          error: `'count' should be less then ${maxMessageFetchCount}`,
        });
      }

      function fetchAsc() {
        return db.message.findMany({
          where: { topicId: topic.id, id: { gt: messageId } },
          orderBy: { id: "asc" },
          take: count,
        });
      }
      async function fetchDesc() {
        let maxMessageId = messageId;
        if (!maxMessageId) {
          const max = await db.message.findMany({
            orderBy: { id: "desc" },
            take: 1,
          });
          maxMessageId = max[0]?.id ?? "";
        }
        return await db.message.findMany({
          where: { topicId: topic.id, id: { lte: maxMessageId } },
          orderBy: { id: "desc" },
          take: count,
        });
      }
      const messages: Message[] =
        dir === "asc" ? await fetchAsc() : await fetchDesc();
      request.log.trace(
        { topicId: topic.id, count, dir, messages: messages.length },
        "Fetch messages"
      );

      return {
        ok: true,
        result: messages.map((message) => ({
          id: message.id,
          body: message.body,
          createdAt: format(message.createdAt, "yyyy-MM-dd HH:mm:ss"),
        })),
      };
    }
  );
}
