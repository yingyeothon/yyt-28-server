import { ErrorResponse, ErrorResponseType } from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import { FastifyInstance } from "fastify";
import TokenResponse from "./models/TokenResponse";
import cuid from "cuid";
import db from "../../infra/db";
import { maxTokenCount } from "../../infra/config";

const CreateTokenParams = Type.Object({
  userId: Type.String(),
});

type CreateTokenParamsType = Static<typeof CreateTokenParams>;

const CreateTokenResponse = Type.Object({
  ok: Type.Literal(true),
  result: TokenResponse,
});

type CreateTokenResponseType = Static<typeof CreateTokenResponse>;

export default function handleCreateToken(fastify: FastifyInstance) {
  fastify.post<{
    Params: CreateTokenParamsType;
    Reply: CreateTokenResponseType | ErrorResponseType;
  }>(
    "/user/:userId/token",
    {
      schema: {
        summary: "Create token",
        description:
          "Create a new token to access this system from the client.",
        params: CreateTokenParams,
        response: {
          200: CreateTokenResponse,
          403: ErrorResponse,
          429: ErrorResponse,
        },
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

      const tokenCount = await db.userToken.count({
        where: { userId, expired: false },
      });
      if (tokenCount > maxTokenCount) {
        request.log.warn({ userId }, "Too many token requested");
        return reply.status(429).send({ error: "Too many tokens" });
      }

      const newToken = await db.userToken.create({
        data: { token: cuid(), userId, expired: false },
      });
      request.log.info({ userId, token: newToken.token }, "Issue new token");
      return { ok: true, result: { token: newToken.token } };
    }
  );
}
