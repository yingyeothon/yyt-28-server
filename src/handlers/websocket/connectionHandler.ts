import { WebSocket } from "ws";
import cuid from "cuid";
import db from "../../infra/db";
import server from "../../infra/server";

const topicConnections: { [topicId: number]: WebSocket[] } = {};

export async function onConnect(topicId: number, socket: WebSocket) {
  topicConnections[topicId] = topicConnections[topicId] ?? [];
  topicConnections[topicId].push(socket);

  server.log.debug({ topicId }, "New connection has come");
}

export async function onDisconnect(topicId: number, socket: WebSocket) {
  topicConnections[topicId] = (topicConnections[topicId] ?? []).filter(
    (each) => each !== socket
  );

  server.log.debug({ topicId }, "Connection is gone");
}

export async function disconnectAll(topicId: number) {
  (topicConnections[topicId] ?? []).forEach((connection) => {
    connection.close(1001);
  });
  server.log.debug({ topicId }, "Disconnect all connections");
  delete topicConnections[topicId];
}

export async function broadcast(topicId: number, message: string) {
  const inserted = await db.message.create({
    data: {
      id: cuid(),
      topicId,
      body: message,
    },
  });
  server.log.trace({ messageId: inserted.id }, "Register message");

  (topicConnections[topicId] ?? []).forEach((socket) => {
    server.log.trace({ topicId, message }, "Broadcast message");
    socket.send(message);
  });
}
