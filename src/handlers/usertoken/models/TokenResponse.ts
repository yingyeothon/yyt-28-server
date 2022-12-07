import { Type } from "@sinclair/typebox";

const TokenResponse = Type.Object({
  token: Type.String(),
});

export default TokenResponse;
