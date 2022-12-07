import { Type } from "@sinclair/typebox";

const TopicResponse = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  createdAt: Type.String(),
});

export default TopicResponse;
