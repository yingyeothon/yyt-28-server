import { ErrorResponse, ErrorResponseType } from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import AccessTokenPayload from "../../models/AccessTokenPayload";
import { FastifyInstance } from "fastify";
import { Message } from "@prisma/client";
import db from "../../infra/db";
import format from "date-fns/format";
import { maxMessageFetchCount } from "../../infra/config";

const FetchMessageQuerystring = Type.Object({
  accessToken: Type.Optional(Type.String()),
  messageId: Type.Optional(Type.String()),
  count: Type.Optional(Type.Number()),
  dir: Type.Optional(Type.Enum({ asc: "asc", desc: "desc" })),
});

type FetchMessageQuerystringType = Static<typeof FetchMessageQuerystring>;

const FetchMessageHeaders = Type.Object({
  ["x-access-token"]: Type.Optional(Type.String()),
});

type FetchMessageHeadersType = Static<typeof FetchMessageHeaders>;

const FetchMessageCookies = Type.Object({
  accessToken: Type.Optional(Type.String()),
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
    Querystring: FetchMessageQuerystringType;
    Headers: FetchMessageHeadersType;
    Cookies: FetchMessageCookiesType;
    Reply: FetchMessageResponseType | ErrorResponseType;
  }>(
    "/message",
    {
      schema: {
        summary: "Fetch messages",
        description: "Fetch messages in the topic from the message id.",
        querystring: FetchMessageQuerystring,
        headers: FetchMessageHeaders,
        response: {
          200: FetchMessageResponse,
          400: ErrorResponse,
          413: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const { cookies, headers, query } = request;
      const accessToken =
        cookies.accessToken ?? headers["x-access-token"] ?? query.accessToken;
      if (!accessToken) {
        request.log.debug(
          { cookies, headers, query },
          "Cannot find access token"
        );
        return reply
          .send({
            error:
              "Cannot find access token. Please use 'accessToken' query parameter",
          })
          .status(400);
      }
      const { topicId } = fastify.jwt.verify<AccessTokenPayload>(
        accessToken as string
      );

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

      const messages: Message[] =
        dir === "asc"
          ? await db.message.findMany({
              where: { topicId, id: { gt: messageId } },
              orderBy: { id: "asc" },
              take: count,
            })
          : await db.message.findMany({
              where: { topicId, id: { lte: messageId } },
              orderBy: { id: "desc" },
              take: count,
            });
      request.log.trace(
        { topicId, count, dir, messages: messages.length },
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
