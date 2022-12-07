import {
  ErrorResponse,
  OkResponseType,
  SuccessResponse,
} from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import { FastifyInstance } from "fastify";
import db from "../../infra/db";

const ActivateUserParams = Type.Object({
  userId: Type.String(),
});

type ActivateUserParamsType = Static<typeof ActivateUserParams>;

export default function handleActivateUser(fastify: FastifyInstance) {
  fastify.post<{ Params: ActivateUserParamsType; Reply: OkResponseType }>(
    "/user/:userId/activate",
    {
      schema: {
        summary: "Activate user",
        description: "Make this user as active.",
        params: ActivateUserParams,
        response: { 200: SuccessResponse, 404: ErrorResponse },
      },
    },
    async (request, reply) => {
      if (request.ip !== "127.0.0.1") {
        request.log.warn({}, "We should access User API in localhost");
        return reply.status(404);
      }

      const { userId } = request.params;
      const user = await db.user.findFirst({ where: { id: userId } });
      if (!user) {
        request.log.warn({ userId }, "Cannot find user");
        return reply
          .status(404)
          .send({ error: `Cannot find user by id: [${userId}]` });
      }

      await db.user.update({
        where: { id: user.id },
        data: { verified: true },
      });
      request.log.info({ userId }, "Activate user account");
      return { ok: true };
    }
  );
}
