import {
  ErrorResponse,
  OkResponseType,
  SuccessResponse,
} from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import { FastifyInstance } from "fastify";
import db from "../../infra/db";

const ExpireTokenParams = Type.Object({
  userId: Type.String(),
  token: Type.String(),
});

type ExpireTokenParamsType = Static<typeof ExpireTokenParams>;

export default function handleExpireToken(fastify: FastifyInstance) {
  fastify.delete<{ Params: ExpireTokenParamsType; Reply: OkResponseType }>(
    "/user/:userId/token/:token",
    {
      schema: {
        summary: "Expire token",
        description: "Expire a token to deny access from the client.",
        params: ExpireTokenParams,
        response: {
          200: SuccessResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const { userId, token } = request.params;
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
        return reply.status(404).send({ error: "Cannot find token" });
      }

      await db.userToken.update({
        data: { expired: true },
        where: { token },
      });
      request.log.info({ userId, token }, "Expire token");
      return { ok: true };
    }
  );
}
