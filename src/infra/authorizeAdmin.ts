import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";

import AuthorizationPayload from "../models/AuthorizationPayload";
import { adminEmail } from "./config";
import { serializeError } from "serialize-error";
import server from "./server";

export default function authorizeAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
  next: HookHandlerDoneFunction
) {
  const { login } = request.cookies ?? {};
  if (login) {
    try {
      const { email } = server.jwt.verify<AuthorizationPayload>(login);
      if (email === adminEmail) {
        return next();
      }
    } catch (error: any) {
      request.log.error({ error: serializeError(error) }, "Cannot authorize");
    }
  }
  request.log.warn({}, "Only admin can access User API");
  return reply.status(401).send({ error: "Unauthorized" });
}
