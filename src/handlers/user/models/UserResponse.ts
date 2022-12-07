import { Type } from "@sinclair/typebox";

const UserResponse = Type.Object({
  id: Type.String(),
  email: Type.String({ format: "email" }),
  verified: Type.Boolean(),
});

export default UserResponse;
