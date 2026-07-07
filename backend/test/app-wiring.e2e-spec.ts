import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/platform/prisma/prisma.service';

interface RegisteredRoute {
  method: string;
  path: string;
}

/**
 * Boots the whole application graph with a mocked PrismaService (so no database
 * is needed) and asserts every module wires up and the routes register in the
 * right order. This is the one integration check that the six bounded contexts
 * compose into a valid Nest application.
 */
describe('AppModule wiring', () => {
  let app: INestApplication;
  let routes: RegisteredRoute[];

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.DATABASE_URL = 'postgresql://test';

    const prismaMock = {
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      activeClient: {},
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    routes = collectRoutes(app);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('registers the authentication routes', () => {
    expect(hasRoute(routes, 'POST', '/api/v1/auth/signup')).toBe(true);
    expect(hasRoute(routes, 'POST', '/api/v1/auth/login')).toBe(true);
    expect(hasRoute(routes, 'GET', '/api/v1/auth/me')).toBe(true);
  });

  it('registers the core feature routes across every module', () => {
    expect(hasRoute(routes, 'GET', '/api/v1/employees')).toBe(true);
    expect(hasRoute(routes, 'POST', '/api/v1/employees')).toBe(true);
    expect(hasRoute(routes, 'GET', '/api/v1/employees/:employeeId/salary')).toBe(true);
    expect(hasRoute(routes, 'PUT', '/api/v1/employees/:employeeId/salary')).toBe(true);
    expect(hasRoute(routes, 'GET', '/api/v1/insights/overview')).toBe(true);
    expect(hasRoute(routes, 'GET', '/api/v1/reference/departments')).toBe(true);
  });

  it('registers the import/export routes', () => {
    expect(hasRoute(routes, 'GET', '/api/v1/employees/export')).toBe(true);
    expect(hasRoute(routes, 'GET', '/api/v1/employees/sample-sheet')).toBe(true);
    expect(hasRoute(routes, 'POST', '/api/v1/employees/import/preview')).toBe(true);
    expect(hasRoute(routes, 'POST', '/api/v1/employees/import/commit')).toBe(true);
  });

  it('registers the literal /employees/export and /sample-sheet BEFORE /employees/:id so they are not shadowed', () => {
    const detailIndex = indexOf(routes, 'GET', '/api/v1/employees/:id');
    expect(detailIndex).toBeGreaterThanOrEqual(0);
    expect(indexOf(routes, 'GET', '/api/v1/employees/export')).toBeLessThan(detailIndex);
    expect(indexOf(routes, 'GET', '/api/v1/employees/sample-sheet')).toBeLessThan(detailIndex);
  });
});

function collectRoutes(app: INestApplication): RegisteredRoute[] {
  const server = app.getHttpAdapter().getInstance() as {
    _router: { stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }> };
  };
  const routes: RegisteredRoute[] = [];
  for (const layer of server._router.stack) {
    if (!layer.route) {
      continue;
    }
    for (const method of Object.keys(layer.route.methods)) {
      routes.push({ method: method.toUpperCase(), path: layer.route.path });
    }
  }
  return routes;
}

function hasRoute(routes: RegisteredRoute[], method: string, path: string): boolean {
  return routes.some((route) => route.method === method && route.path === path);
}

function indexOf(routes: RegisteredRoute[], method: string, path: string): number {
  return routes.findIndex((route) => route.method === method && route.path === path);
}
