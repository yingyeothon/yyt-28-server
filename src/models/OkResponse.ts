import { Static, Type } from "@sinclair/typebox";

export const ErrorResponse = Type.Object({
  error: Type.String(),
});
export type ErrorResponseType = Static<typeof ErrorResponse>;

export const SuccessResponse = Type.Object({
  ok: Type.Literal(true),
});
export type SuccessResponseType = Static<typeof SuccessResponse>;

const OkResponse = Type.Union([SuccessResponse, ErrorResponse]);
export default OkResponse;

export type OkResponseType = Static<typeof OkResponse>;
