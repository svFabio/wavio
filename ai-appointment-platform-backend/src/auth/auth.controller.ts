import { Controller, Post, Get, Put, Delete, Patch, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard, type TenantUser } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NegocioIdHeader } from '../common/decorators/negocio-id-header.decorator';
import type { JwtPayload } from '../common/utils/jwt';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  googleLoginSchema,
  emailAuthSchema,
  avatarSchema,
  nombreSchema,
  cambiarPasswordSchema,
  resetPasswordSchema,
} from './dto/auth.dto';

type LoginGoogleResult = Awaited<ReturnType<AuthService['loginConGoogle']>>;
type RegistrarResult = Awaited<ReturnType<AuthService['registrarConEmail']>>;
type LoginEmailResult = Awaited<ReturnType<AuthService['loginConEmail']>>;
type MeResult = Awaited<ReturnType<AuthService['obtenerUsuarioActual']>>;
type AvatarResult = Awaited<ReturnType<AuthService['updateAvatar']>>;
type DeleteAvatarResult = Awaited<ReturnType<AuthService['deleteAvatar']>>;
type NombreResult = Awaited<ReturnType<AuthService['updateNombre']>>;
type CambiarPasswordResult = Awaited<ReturnType<AuthService['cambiarPassword']>>;
type ResetPasswordResult = Awaited<ReturnType<AuthService['resetPassword']>>;

@Controller('api/v1/auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  loginConGoogle(
    @Body(new ZodValidationPipe(googleLoginSchema)) body: { googleToken: string },
  ): Promise<LoginGoogleResult> {
    return this.authService.loginConGoogle(body.googleToken);
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  registrarConEmail(
    @Body(new ZodValidationPipe(emailAuthSchema)) body: { email: string; password: string },
  ): Promise<RegistrarResult> {
    return this.authService.registrarConEmail(body.email, body.password);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  loginConEmail(
    @Body(new ZodValidationPipe(emailAuthSchema)) body: { email: string; password: string },
  ): Promise<LoginEmailResult> {
    return this.authService.loginConEmail(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(
    @CurrentUser() user: JwtPayload,
    @NegocioIdHeader() negocioIdHeader?: string,
  ): Promise<MeResult> {
    return this.authService.obtenerUsuarioActual(user.id, negocioIdHeader);
  }

  @Put('me/avatar')
  @UseGuards(JwtAuthGuard, TenantGuard)
  updateAvatar(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(avatarSchema)) body: { image: string },
  ): Promise<AvatarResult> {
    return this.authService.updateAvatar(user.id, user.negocioId, body.image);
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard, TenantGuard)
  deleteAvatar(@CurrentUser() user: TenantUser): Promise<DeleteAvatarResult> {
    return this.authService.deleteAvatar(user.id, user.negocioId);
  }

  @Patch('me/nombre')
  @UseGuards(JwtAuthGuard, TenantGuard)
  updateNombre(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(nombreSchema)) body: { nombre: string },
  ): Promise<NombreResult> {
    return this.authService.updateNombre(user.id, user.negocioId, body.nombre);
  }

  @Post('cambiar-password')
  @UseGuards(JwtAuthGuard)
  cambiarPassword(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(cambiarPasswordSchema))
    body: { passwordActual?: string; passwordNueva: string },
  ): Promise<CambiarPasswordResult> {
    return this.authService.cambiarPassword(user.id, body.passwordActual, body.passwordNueva);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: { email: string },
  ): Promise<ResetPasswordResult> {
    return this.authService.resetPassword(body.email);
  }
}
