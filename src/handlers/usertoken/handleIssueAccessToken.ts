import { ErrorResponse, ErrorResponseType } from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import AccessTokenPayload from "../../models/AccessTokenPayload";
import { FastifyInstance } from "fastify";
import { accessTokenExpiresIn } from "../../infra/config";
import db from "../../infra/db";

const IssueAccessTokenParams = Type.Object({
  userId: Type.String(),
});

type IssueAccessTokenParamsType = Static<typeof IssueAccessTokenParams>;

const IssueAccessTokenBody = Type.Object({
  token: Type.String(),
  topic: Type.String(),
});

type IssueAccessTokenBodyType = Static<typeof IssueAccessTokenBody>;

const IssueAccessTokenResponse = Type.Object({
  ok: Type.Literal(true),
  result: Type.Object({
    accessToken: Type.String(),
  }),
});

type IssueAccessTokenResponseType = Static<typeof IssueAccessTokenResponse>;

export default function handleIssueAccessToken(fastify: FastifyInstance) {
  fastify.post<{
    Params: IssueAccessTokenParamsType;
    Body: IssueAccessTokenBodyType;
    Reply: IssueAccessTokenResponseType | ErrorResponseType;
  }>(
    "/user/:userId/access",
    {
      schema: {
        summary: "Issue access token",
        description:
          "Issue a new access token to join the topic from the client.",
        params: IssueAccessTokenParams,
        body: IssueAccessTokenBody,
        response: {
          200: IssueAccessTokenResponse,
          400: ErrorResponse,
          403: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const {
        params: { userId },
        body: { token, topic },
      } = request;
      if (!token || !topic) {
        return reply.status(400).send({
          error: `Request body should have 'token' and 'topic' field`,
        });
      }

      if (
        (await db.user.count({ where: { id: userId, verified: true } })) === 0
      ) {
        request.log.warn({ userId }, "Cannot find user");
        return reply.status(403).send({ error: "Cannot find user" });
      }

      if (
        (await db.userToken.count({
          where: { userId, token, expired: false },
        })) === 0
      ) {
        request.log.warn({ userId, token, topic }, "Invalid user token");
        return reply.status(403).send({ error: "Invalid user token" });
      }
      const maybeTopic = await db.topic.findFirst({
        where: { userId, name: topic, deleted: false },
      });
      if (!maybeTopic) {
        request.log.warn({ userId, token, topic }, "Invalid topic");
        return reply.status(403).send({ error: "Invalid topic" });
      }

      const payload: AccessTokenPayload = {
        topicId: maybeTopic.id,
      };
      const accessToken = await reply.jwtSign(payload, {
        expiresIn: accessTokenExpiresIn,
      });
      request.log.trace(
        { accessToken, userId, token, topic },
        "Issue access token"
      );
      return { ok: true, result: { accessToken } };
    }
  );
}
