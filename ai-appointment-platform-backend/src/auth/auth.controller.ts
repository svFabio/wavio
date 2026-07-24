import { Controller, Post, Get, Put, Delete, Patch, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/utils/jwt';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { googleLoginSchema, emailAuthSchema, avatarSchema, nombreSchema } from './dto/auth.dto';

@Controller('api/v1/auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  loginConGoogle(@Body(new ZodValidationPipe(googleLoginSchema)) body: { googleToken: string }) {
    return this.authService.loginConGoogle(body.googleToken);
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  registrarConEmail(
    @Body(new ZodValidationPipe(emailAuthSchema)) body: { email: string; password: string },
  ) {
    return this.authService.registrarConEmail(body.email, body.password);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  loginConEmail(
    @Body(new ZodValidationPipe(emailAuthSchema)) body: { email: string; password: string },
  ) {
    return this.authService.loginConEmail(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.obtenerUsuarioActual(user.id);
  }

  @Put('me/avatar')
  @UseGuards(JwtAuthGuard)
  updateAvatar(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(avatarSchema)) body: { image: string },
  ) {
    return this.authService.updateAvatar(user.id, user.negocioId, body.image);
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard)
  deleteAvatar(@CurrentUser() user: JwtPayload) {
    return this.authService.deleteAvatar(user.id, user.negocioId);
  }

  @Patch('me/nombre')
  @UseGuards(JwtAuthGuard)
  updateNombre(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(nombreSchema)) body: { nombre: string },
  ) {
    return this.authService.updateNombre(user.id, user.negocioId, body.nombre);
  }
}
