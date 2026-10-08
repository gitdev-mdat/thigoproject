import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ApplicationRole } from "../entities/auth/user-role.entity.js";
import { AuthService } from "../services/auth/auth.service.js";

export interface AuthenticatedUser {
  id: string;
  phone: string;
}

type AuthenticatedRequest = {
  headers: { authorization?: string };
  thigoUser?: AuthenticatedUser;
};

const REQUIRED_ROLE = "thigo:required-role";

/** Requires a bearer session whose user holds this role. */
export const RequireRole = (role: ApplicationRole) =>
  SetMetadata(REQUIRED_ROLE, role);

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedUser => {
    const user = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>().thigoUser;
    if (!user) throw new UnauthorizedException();
    return user;
  }
);

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const role = this.reflector.getAllAndOverride<ApplicationRole | undefined>(
      REQUIRED_ROLE,
      [context.getHandler(), context.getClass()]
    );
    // Fail closed: a guarded route without a declared role is a wiring mistake.
    if (!role) throw new ForbiddenException();
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedException();
    const session = await this.auth.authenticate(header.slice(7));
    if (!session.user.roles.some((item) => item.role === role))
      throw new ForbiddenException();
    request.thigoUser = { id: session.user.id, phone: session.user.phone };
    return true;
  }
}
