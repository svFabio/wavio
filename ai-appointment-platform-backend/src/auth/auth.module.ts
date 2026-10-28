import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TenantGuard } from '../common/guards/tenant.guard';

@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JwtStrategy, TenantGuard],
  exports: [AuthService, TenantGuard],
})
export class AuthModule {}
