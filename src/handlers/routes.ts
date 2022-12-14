import { FastifyInstance } from "fastify";
import handleActivateUser from "./user/handleActivateUser";
import handleCreateToken from "./usertoken/handleCreateToken";
import handleCreateTopic from "./topic/handleCreateTopic";
import handleCreateUser from "./user/handleCreateUser";
import handleDeleteTopic from "./topic/handleDeleteTopic";
import handleDeleteUser from "./user/handleDeleteUser";
import handleExpireToken from "./usertoken/handleExpireToken";
import handleFetchMessages from "./message/handleFetchMessages";
import handleListTokens from "./usertoken/handleListTokens";
import handleListTopics from "./topic/handleListTopics";
import handleListUsers from "./user/handleListUsers";
import handlePostMessage from "./message/handlePostMessage";
import handleWebSocket from "./websocket/handleWebSocket";

export default async function routes(fastify: FastifyInstance) {
  fastify.register(
    async function (fastify) {
      handleWebSocket(fastify);
    },
    { prefix: "/websocket" }
  );
  fastify.register(
    async function (fastify) {
      handleCreateUser(fastify);
      handleDeleteUser(fastify);
      handleListUsers(fastify);
      handleActivateUser(fastify);

      handleCreateToken(fastify);
      handleExpireToken(fastify);
      handleListTokens(fastify);

      handleCreateTopic(fastify);
      handleDeleteTopic(fastify);
      handleListTopics(fastify);

      handleFetchMessages(fastify);
      handlePostMessage(fastify);
    },
    { prefix: "/api" }
  );
}
