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
import { readAuthEnvironment } from "../config/auth-environment.js";
import { ApplicationRole } from "../entities/auth/user-role.entity.js";
import { AuthService } from "../services/auth/auth.service.js";

export interface AuthenticatedUser {
  id: string;
  phone: string;
}

type AuthenticatedRequest = {
  headers: { authorization?: string; cookie?: string };
  thigoUser?: AuthenticatedUser;
};

const REQUIRED_ROLE = "thigo:required-role";

/**
 * Requires a session whose user holds this role: a bearer token from the
 * mobile apps, or, for ADMIN routes only, the admin web's httpOnly cookie.
 */
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
  private readonly adminCookieName = readAuthEnvironment(process.env)
    .adminCookieName;

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
    const token = this.token(request, role);
    if (!token) throw new UnauthorizedException();
    const session = await this.auth.authenticate(token);
    if (!session.user.roles.some((item) => item.role === role))
      throw new ForbiddenException();
    request.thigoUser = { id: session.user.id, phone: session.user.phone };
    return true;
  }

  private token(
    request: AuthenticatedRequest,
    role: ApplicationRole
  ): string | undefined {
    const header = request.headers.authorization;
    if (header?.startsWith("Bearer ")) return header.slice(7) || undefined;
    if (role !== ApplicationRole.ADMIN) return undefined;
    const pair = request.headers.cookie
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${this.adminCookieName}=`));
    if (!pair) return undefined;
    try {
      return decodeURIComponent(pair.slice(pair.indexOf("=") + 1)) || undefined;
    } catch {
      return undefined;
    }
  }
}
