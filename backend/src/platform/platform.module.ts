import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfig } from './config/app-config';
import { PrismaService } from './prisma/prisma.service';
import { PrismaUnitOfWork, UnitOfWork } from './prisma/unit-of-work';
import { TenantContext } from './tenancy/tenant-context';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

/**
 * The foundation every feature module stands on. @Global() so PrismaService,
 * TenantContext, AppConfig, and the JWT plumbing are injectable everywhere
 * without re-importing. Registers the JwtAuthGuard globally (APP_GUARD) so auth
 * is enforced by default and only @Public() routes opt out.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    JwtModule.registerAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.jwtExpiresIn },
      }),
    }),
  ],
  providers: [
    AppConfig,
    PrismaService,
    TenantContext,
    JwtStrategy,
    { provide: UnitOfWork, useClass: PrismaUnitOfWork },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [AppConfig, PrismaService, TenantContext, UnitOfWork, JwtModule],
})
export class PlatformModule {}
