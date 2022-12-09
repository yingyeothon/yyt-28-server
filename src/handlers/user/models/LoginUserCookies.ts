import { Static, Type } from "@sinclair/typebox";

const LoginUserCookies = Type.Object({
  login: Type.Optional(Type.String()),
});

export default LoginUserCookies;

export type LoginUserCookiesType = Static<typeof LoginUserCookies>;
