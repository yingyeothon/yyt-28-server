import { ErrorResponse, ErrorResponseType } from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import { FastifyInstance } from "fastify";
import TokenResponse from "./models/TokenResponse";
import db from "../../infra/db";

const ListTokensParams = Type.Object({
  userId: Type.String(),
});

type ListTokensParamsType = Static<typeof ListTokensParams>;

const ListTokensResponse = Type.Object({
  ok: Type.Literal(true),
  result: Type.Array(TokenResponse),
});

type ListTokensResponseType = Static<typeof ListTokensResponse>;

export default function handleListTokens(fastify: FastifyInstance) {
  fastify.get<{
    Params: ListTokensParamsType;
    Reply: ListTokensResponseType | ErrorResponseType;
  }>(
    "/user/:userId/token",
    {
      schema: {
        summary: "List tokens",
        description: "List all tokens in this user.",
        params: ListTokensParams,
        response: { 200: ListTokensResponse, 403: ErrorResponse },
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

      const tokens = await db.userToken.findMany({
        where: { userId, expired: false },
      });
      request.log.debug(
        { userId, tokens: tokens.length },
        "Find all user tokens"
      );
      return {
        ok: true,
        result: tokens.map((token) => ({ token: token.token })),
      };
    }
  );
}
