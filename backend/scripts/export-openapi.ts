// Writes backend/openapi.json — the single source of truth the frontend
// generates its typed client from (architecture.md §8: "no hand-written
// client"). Boots the app via a Nest TestingModule with PrismaService mocked
// (same trick as test/app-wiring.e2e-spec.ts), so it never needs a live
// Postgres connection — every response/request shape is a decorated DTO class
// with explicit @ApiProperty(), so Swagger needs no compiler-plugin inference.
//
// Usage: npx ts-node -r tsconfig-paths/register scripts/export-openapi.ts

import { writeFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/platform/prisma/prisma.service';

async function main(): Promise<void> {
  process.env.JWT_SECRET ??= 'export-openapi-placeholder-secret';
  process.env.DATABASE_URL ??= 'postgresql://export-openapi-placeholder';

  const prismaMock = {
    onModuleInit: async () => undefined,
    onModuleDestroy: async () => undefined,
    activeClient: {},
  };

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prismaMock)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  await app.init();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tankha API')
    .setDescription('HR salary & compensation management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  writeFileSync('openapi.json', JSON.stringify(document, null, 2));
  console.log(`Wrote openapi.json (${Object.keys(document.paths).length} paths).`);

  await app.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
