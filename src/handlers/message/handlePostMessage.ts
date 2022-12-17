import {
  ErrorResponse,
  OkResponseType,
  SuccessResponse,
} from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import { FastifyInstance } from "fastify";
import { broadcast } from "../websocket/connectionHandler";
import validateTopicAndToken from "../../infra/validateTopicAndToken";

const PostMessageParams = Type.Object({
  topicName: Type.String(),
});

type PostMessageParamsType = Static<typeof PostMessageParams>;

const PostMessageQuerystring = Type.Object({
  token: Type.Optional(Type.String()),
});

type PostMessageQuerystringType = Static<typeof PostMessageQuerystring>;

const PostMessageHeaders = Type.Object({
  "x-token": Type.Optional(Type.String()),
});

type PostMessageHeadersType = Static<typeof PostMessageHeaders>;

const PostMessageCookies = Type.Object({
  token: Type.Optional(Type.String()),
});

type PostMessageCookiesType = Static<typeof PostMessageCookies>;

const PostMessageBody = Type.String();

type PostMessageBodyType = Static<typeof PostMessageBody>;

export default function handlePostMessage(fastify: FastifyInstance) {
  fastify.post<{
    Params: PostMessageParamsType;
    Querystring: PostMessageQuerystringType;
    Headers: PostMessageHeadersType;
    Cookies: PostMessageCookiesType;
    Body: PostMessageBodyType;
    Reply: OkResponseType;
  }>(
    "/message/:topicName",
    {
      schema: {
        summary: "Post message",
        description: "Post a message into the topic.",
        consumes: ["text/plain"],
        params: PostMessageParams,
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
      if (!request.body) {
        request.log.debug({ topicId: topic.id }, "No request body");
        return reply.status(400).send({ error: "Empty request body" });
      }

      await broadcast(topic.id, request.body);
      return { ok: true };
    }
  );
}
