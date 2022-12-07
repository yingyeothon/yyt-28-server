import {
  ErrorResponse,
  OkResponseType,
  SuccessResponse,
} from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import AccessTokenPayload from "../../models/AccessTokenPayload";
import { FastifyInstance } from "fastify";
import { broadcast } from "../websocket/connectionHandler";
import db from "../../infra/db";

const PostMessageQuerystring = Type.Object({
  accessToken: Type.Optional(Type.String()),
});

type PostMessageQuerystringType = Static<typeof PostMessageQuerystring>;

const PostMessageHeaders = Type.Object({
  ["x-access-token"]: Type.Optional(Type.String()),
});

type PostMessageHeadersType = Static<typeof PostMessageHeaders>;

const PostMessageCookies = Type.Object({
  accessToken: Type.Optional(Type.String()),
});

type PostMessageCookiesType = Static<typeof PostMessageCookies>;

const PostMessageBody = Type.String();

type PostMessageBodyType = Static<typeof PostMessageBody>;

export default function handlePostMessage(fastify: FastifyInstance) {
  fastify.post<{
    Querystring: PostMessageQuerystringType;
    Headers: PostMessageHeadersType;
    Cookies: PostMessageCookiesType;
    Body: PostMessageBodyType;
    Reply: OkResponseType;
  }>(
    "/message",
    {
      schema: {
        summary: "Post message",
        description: "Post a message into the topic.",
        consumes: ["text/plain"],
        querystring: PostMessageQuerystring,
        headers: PostMessageHeaders,
        body: PostMessageBody,
        response: {
          200: SuccessResponse,
          400: ErrorResponse,
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

      const topic = await db.topic.findFirstOrThrow({
        where: { id: topicId },
      });
      if (topic.deleted) {
        request.log.debug({ topicId }, "Already deleted topic");
        return reply.status(400).send({ error: "Already deleted topic" });
      }
      if (!request.body) {
        request.log.debug({ topicId }, "No request body");
        return reply.status(400).send({ error: "Empty request body" });
      }

      await broadcast(topicId, request.body);
      return { ok: true };
    }
  );
}
