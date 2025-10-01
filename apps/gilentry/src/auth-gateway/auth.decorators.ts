import { applyDecorators, createParamDecorator, ExecutionContext, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthenticatedUser } from "@shared/types";

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const request = ctx.switchToHttp().getRequest();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const user: AuthenticatedUser = request.user as AuthenticatedUser;
  if (!user.user_id) {
    throw new Error("User ID is missing");
  }
  console.log(user);
  return user;
});

export function Auth() {
  return applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth());
}
