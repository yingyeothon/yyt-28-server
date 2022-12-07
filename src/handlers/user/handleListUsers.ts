import { ErrorResponse, ErrorResponseType } from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import { FastifyInstance } from "fastify";
import UserResponse from "./models/UserResponse";
import db from "../../infra/db";

const ListUsersResponse = Type.Object({
  ok: Type.Literal(true),
  result: Type.Array(UserResponse),
});

type ListUsersResponseType = Static<typeof ListUsersResponse>;

export default function handleListUsers(fastify: FastifyInstance) {
  fastify.get<{ Reply: ListUsersResponseType | ErrorResponseType }>(
    "/user",
    {
      schema: {
        summary: "List users",
        description: "Show all users in this system.",
        response: {
          200: ListUsersResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      if (request.ip !== "127.0.0.1") {
        request.log.warn({}, "We should access User API in localhost");
        return reply.status(404);
      }

      const users = await db.user.findMany();
      request.log.debug({ users: users.length }, "Find all users");
      return {
        ok: true,
        result: users.map((u) => ({
          id: u.id,
          verified: u.verified,
          email: u.email,
        })),
      };
    }
  );
}
