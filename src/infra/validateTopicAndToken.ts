import { Topic } from "@prisma/client";
import db from "./db";

export default async function validateTopicAndToken(
  topicName: string,
  token: string
): Promise<{ topic: Topic } | false> {
  const userToken = await db.userToken.findFirst({
    where: { token, expired: false },
  });
  if (!userToken) {
    return false;
  }
  const topic = await db.topic.findFirst({
    where: { name: topicName, deleted: false },
  });
  if (!topic) {
    return false;
  }
  if (userToken.userId !== topic.userId) {
    return false;
  }
  return { topic };
}
