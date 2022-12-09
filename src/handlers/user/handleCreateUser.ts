import { ErrorResponse, ErrorResponseType } from "../../models/OkResponse";
import { Static, Type } from "@sinclair/typebox";

import { FastifyInstance } from "fastify";
import UserResponse from "./models/UserResponse";
import cuid from "cuid";
import db from "../../infra/db";
import { serializeError } from "serialize-error";

const CreateUserRequest = Type.Object({
  email: Type.String({ format: "email" }),
});

type CreateUserRequestType = Static<typeof CreateUserRequest>;

const CreateUserResponse = Type.Object({
  ok: Type.Literal(true),
  result: UserResponse,
});

type CreateUserResponseType = Static<typeof CreateUserResponse>;

export default function handleCreateUser(fastify: FastifyInstance) {
  fastify.post<{
    Body: CreateUserRequestType;
    Reply: CreateUserResponseType | ErrorResponseType;
  }>(
    "/user",
    {
      schema: {
        summary: "Create user",
        description: "Create a new user.",
        body: CreateUserRequest,
        response: {
          200: CreateUserResponse,
          400: ErrorResponse,
          404: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      if (request.ip !== "127.0.0.1") {
        request.log.warn({}, "We should access User API in localhost");
        return reply.status(404);
      }
      const { email } = request.body;
      try {
        const newUser = await db.user.create({
          data: { id: cuid(), email, verified: false },
        });
        request.log.info({ newUser }, "Add new user");
        return {
          ok: true,
          result: { id: newUser.id, email: newUser.email, verified: false },
        };
      } catch (error: any) {
        if (/Unique constraint failed/.test(error.message)) {
          request.log.warn(
            { email, error: serializeError(error) },
            "Maybe email is duplicate"
          );
          return reply.status(400).send({ error: "Duplicate email address" });
        }
        request.log.error(
          { email, error: serializeError(error) },
          "Cannot create user"
        );
        return reply
          .status(500)
          .send({ error: "Error occurred from database" });
      }
    }
  );
}
