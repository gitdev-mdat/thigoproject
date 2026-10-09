import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { AuthService } from "../services/auth/auth.service.js";
import type { AuthenticatedUser } from "./role.guard.js";

type SessionRequest = {
  headers: { authorization?: string };
  thigoUser?: AuthenticatedUser;
};

/**
 * Requires a valid bearer session but no particular role. Only for routes
 * whose service scopes everything to the signed-in user's own phone, such as
 * a merchant application.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new UnauthorizedException();
    const session = await this.auth.authenticate(token);
    request.thigoUser = { id: session.user.id, phone: session.user.phone };
    return true;
  }
}
