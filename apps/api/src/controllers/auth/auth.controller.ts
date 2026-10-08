import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Res,
  UnauthorizedException
} from "@nestjs/common";
import type { Response } from "express";
import { readAuthEnvironment } from "../../config/auth-environment.js";
import { RequestOtpDto, VerifyOtpDto } from "../../dto/auth/auth.dto.js";
import { ApplicationRole } from "../../entities/auth/user-role.entity.js";
import { AuthService } from "../../services/auth/auth.service.js";
@Controller("auth")
export class AuthController {
  private readonly config = readAuthEnvironment(process.env);
  constructor(private readonly auth: AuthService) {}
  @Post("otp/request") request(@Body() body: RequestOtpDto) {
    return this.auth.requestOtp(body.phone);
  }
  @Post("otp/verify") async verify(
    @Body() body: VerifyOtpDto,
    @Res({ passthrough: true }) response: Response
  ) {
    if (!Object.values(ApplicationRole).includes(body.application))
      throw new ForbiddenException();
    const result = await this.auth.verifyOtp(
      body.phone,
      body.otp,
      body.application
    );
    if (body.application === ApplicationRole.ADMIN) {
      response.cookie(this.config.adminCookieName, result.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: this.config.secureCookie,
        maxAge: this.config.sessionExpirySeconds * 1000,
        path: "/"
      });
      return { user: result.user };
    }
    return result;
  }
  @Get("me") async me(
    @Headers("authorization") authorization: string | undefined,
    @Headers("cookie") cookie: string | undefined
  ) {
    const session = await this.auth.authenticate(
      this.token(authorization, cookie)
    );
    return {
      id: session.user.id,
      phone: session.user.phone,
      roles: session.user.roles.map((item) => item.role)
    };
  }
  @Get("access/:role") async access(
    @Param("role") role: string,
    @Headers("authorization") authorization: string | undefined,
    @Headers("cookie") cookie: string | undefined
  ) {
    const session = await this.auth.authenticate(
      this.token(authorization, cookie)
    );
    const required = role.toUpperCase() as ApplicationRole;
    if (
      !Object.values(ApplicationRole).includes(required) ||
      !session.user.roles.some((item) => item.role === required)
    )
      throw new ForbiddenException();
    return { allowed: true };
  }
  @Post("logout") async logout(
    @Headers("authorization") authorization: string | undefined,
    @Headers("cookie") cookie: string | undefined,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.auth.logout(this.token(authorization, cookie));
    response.clearCookie(this.config.adminCookieName, { path: "/" });
    return { loggedOut: true };
  }
  private token(authorization?: string, cookie?: string): string {
    if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
    const pair = cookie
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${this.config.adminCookieName}=`));
    if (pair) return decodeURIComponent(pair.slice(pair.indexOf("=") + 1));
    throw new UnauthorizedException();
  }
}
