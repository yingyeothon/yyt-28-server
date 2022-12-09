import {
  ErrorResponse,
  OkResponseType,
  SuccessResponse,
} from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import { FastifyInstance } from "fastify";
import authorizeAdmin from "../../infra/authorizeAdmin";
import db from "../../infra/db";
import { disconnectAll } from "../websocket/connectionHandler";

const DeleteUserParams = Type.Object({
  userId: Type.String(),
});

type DeleteUserParamsType = Static<typeof DeleteUserParams>;

export default function handleDeleteUser(fastify: FastifyInstance) {
  fastify.delete<{ Params: DeleteUserParamsType; Reply: OkResponseType }>(
    "/user/:userId",
    {
      schema: {
        summary: "Delete user",
        description:
          "Delete a user and reclaim all resources such as token and topic.",
        params: DeleteUserParams,
        response: {
          200: SuccessResponse,
          400: ErrorResponse,
          404: ErrorResponse,
        },
      },
      preValidation: authorizeAdmin,
    },
    async (request, reply) => {
      const { userId } = request.params;
      const user = await db.user.findFirst({ where: { id: userId } });
      if (!user) {
        return reply
          .status(400)
          .send({ error: `Cannot find user by id: [${userId}]` });
      }

      await db.deletedUser.create({
        data: {
          id: user.id,
          email: user.email,
          verified: user.verified,
          createdAt: user.createdAt,
        },
      });

      for (const topic of await db.topic.findMany({
        where: { userId, deleted: false },
      })) {
        request.log.info({ userId, topicName: topic.name }, "Close topic");
        disconnectAll(topic.id);
      }
      await Promise.all([
        db.topic.updateMany({ data: { deleted: true }, where: { userId } }),
        db.userToken.updateMany({ data: { expired: true }, where: { userId } }),
        db.user.delete({ where: { id: user.id } }),
      ]);
      request.log.info({ userId }, "Delete user");
      return { ok: true };
    }
  );
}
