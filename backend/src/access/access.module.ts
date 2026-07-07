import { Module } from '@nestjs/common';
import { UserRepository } from './domain/user.repository';
import { OrganisationRepository } from './domain/organisation.repository';
import { PasswordHasher } from './domain/password';
import { TokenSigner } from './domain/token-signer';
import { ReferenceSeeder } from './domain/reference-seeder';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { PrismaOrganisationRepository } from './infrastructure/prisma-organisation.repository';
import { Argon2PasswordHasher } from './infrastructure/argon2-password';
import { JwtTokenSigner } from './infrastructure/jwt-token-signer';
import { PrismaReferenceSeeder } from './infrastructure/reference-seeder';
import { SignUpUseCase } from './application/sign-up.usecase';
import { LogInUseCase } from './application/log-in.usecase';
import { GetSessionUseCase } from './application/get-session.usecase';
import { AuthController } from './interface/auth.controller';

/**
 * Authentication & organisation context. Binds each domain port to its Prisma /
 * argon2 / JWT adapter and exposes the auth endpoints. Depends only on platform
 * (PrismaService, UnitOfWork, TenantContext, the global JwtModule). Exports the
 * user and organisation repository ports so later modules can resolve principals
 * without re-implementing persistence.
 */
@Module({
  controllers: [AuthController],
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: OrganisationRepository, useClass: PrismaOrganisationRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    { provide: TokenSigner, useClass: JwtTokenSigner },
    { provide: ReferenceSeeder, useClass: PrismaReferenceSeeder },
    SignUpUseCase,
    LogInUseCase,
    GetSessionUseCase,
  ],
  exports: [UserRepository, OrganisationRepository],
})
export class AccessModule {}
