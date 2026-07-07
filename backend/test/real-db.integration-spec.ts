import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/platform/http/domain-exception.filter';

/**
 * Exercises the real stack end to end: a live NestJS app, real Prisma, real
 * Postgres. This is the suite that catches what in-memory-fake unit tests
 * structurally cannot — e.g. the PrismaService Proxy `this`-binding bug and the
 * 5s interactive-transaction timeout found while building this backend.
 *
 * Requires a reachable DATABASE_URL (see backend/.env) with the schema migrated
 * and Country/Currency reference data seeded (`npm run prisma:migrate && npm run seed`).
 * Kept in a separate Jest project (`npm run test:e2e:db`) so the default
 * `npm test` / `npm run test:e2e` need no database.
 */
describe('Tankha API — real Postgres', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  function unique(label: string): string {
    return `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  }

  async function signUp(orgLabel: string) {
    const email = `${unique('user')}@tankha.dev`;
    const password = 'a-secure-pass-1';
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ name: 'Test HR', email, password, organisationName: unique(orgLabel) })
      .expect(201);
    return { token: response.body.accessToken as string, email, password };
  }

  async function firstReferenceIds(token: string) {
    const departments = await request(app.getHttpServer())
      .get('/api/v1/reference/departments')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const designations = await request(app.getHttpServer())
      .get('/api/v1/reference/designations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    return { departmentId: departments.body[0].id, designationId: designations.body[0].id };
  }

  async function createEmployee(token: string, employeeCode: string) {
    const { departmentId, designationId } = await firstReferenceIds(token);
    const response = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeCode,
        firstName: 'Ravi',
        lastName: 'Kumar',
        departmentId,
        designationId,
        countryCode: 'IN',
        currencyCode: 'INR',
        joinDate: '2021-04-01',
        salary: { components: [{ type: 'BASIC', amountMinor: 8_000_000 }, { type: 'HOUSE_RENT_ALLOWANCE', amountMinor: 4_000_000 }] },
      })
      .expect(201);
    return response.body;
  }

  describe('signup and login', () => {
    it('signs up a new organisation with an owner user and seeded reference data', async () => {
      const { token } = await signUp('acme');

      const { departmentId } = await firstReferenceIds(token);
      expect(departmentId).toBeTruthy();
    });

    it('rejects a duplicate signup email with 409', async () => {
      const email = `${unique('dupe')}@tankha.dev`;
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({ name: 'A', email, password: 'a-secure-pass-1', organisationName: unique('org') })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({ name: 'B', email, password: 'another-pass-1', organisationName: unique('org') })
        .expect(409);

      expect(response.body.error).toBe('CONFLICT');
    });

    it('gives an identical generic 401 for wrong password and unknown email (no account probing)', async () => {
      const { email } = await signUp('login-org');

      const wrongPassword = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'totally-wrong-1' })
        .expect(401);
      const unknownEmail = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: `${unique('nobody')}@tankha.dev`, password: 'whatever-1' })
        .expect(401);

      expect(wrongPassword.body.message).toBe('Email or password is incorrect.');
      expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
    });
  });

  describe('employee creation and salary (cross-module transaction)', () => {
    it('creates an employee with its initial salary atomically and lists it with the total', async () => {
      const { token } = await signUp('workforce-org');

      const employee = await createEmployee(token, unique('EMP'));

      expect(employee.salary.totalMinor).toBe(12_000_000);

      const list = await request(app.getHttpServer())
        .get('/api/v1/employees?page=1&pageSize=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(list.body.data[0].salaryTotalMinor).toBe(12_000_000);
    });

    it('edits salary, appending an audited old→new revision on top of the initial one', async () => {
      const { token } = await signUp('salary-org');
      const employee = await createEmployee(token, unique('EMP'));

      await request(app.getHttpServer())
        .put(`/api/v1/employees/${employee.id}/salary`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          components: [{ type: 'BASIC', amountMinor: 9_000_000 }, { type: 'HOUSE_RENT_ALLOWANCE', amountMinor: 4_500_000 }],
          remark: 'Annual increment',
        })
        .expect(200);

      const revisions = await request(app.getHttpServer())
        .get(`/api/v1/employees/${employee.id}/salary/revisions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(revisions.body.total).toBe(2);
      expect(revisions.body.data[0]).toMatchObject({ oldTotalMinor: 12_000_000, newTotalMinor: 13_500_000 });
      expect(revisions.body.data[1]).toMatchObject({ oldTotalMinor: null, newTotalMinor: 12_000_000 });
    });

    it('rejects a duplicate employeeCode within the same organisation with 409', async () => {
      const { token } = await signUp('dup-code-org');
      const code = unique('EMP');
      await createEmployee(token, code);

      const { departmentId, designationId } = await firstReferenceIds(token);
      const response = await request(app.getHttpServer())
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeCode: code,
          firstName: 'X',
          lastName: 'Y',
          departmentId,
          designationId,
          countryCode: 'IN',
          currencyCode: 'INR',
          joinDate: '2021-04-01',
          salary: { components: [{ type: 'BASIC', amountMinor: 100 }] },
        })
        .expect(409);

      expect(response.body.details).toEqual([{ field: 'employeeCode', reason: 'duplicate' }]);
    });
  });

  describe('tenant isolation (FR-1.3)', () => {
    it('gives org B a 404 for org A\'s employee, and empty lists/insights — never a cross-tenant leak', async () => {
      const orgA = await signUp('tenant-a');
      const orgB = await signUp('tenant-b');
      const employee = await createEmployee(orgA.token, unique('EMP'));

      await request(app.getHttpServer())
        .get(`/api/v1/employees/${employee.id}`)
        .set('Authorization', `Bearer ${orgB.token}`)
        .expect(404);

      const listB = await request(app.getHttpServer())
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${orgB.token}`)
        .expect(200);
      expect(listB.body.data).toEqual([]);

      const insightsB = await request(app.getHttpServer())
        .get('/api/v1/insights/overview')
        .set('Authorization', `Bearer ${orgB.token}`)
        .expect(200);
      expect(insightsB.body.headcount).toBe(0);
    });

    it('rejects any request without a bearer token', async () => {
      await request(app.getHttpServer()).get('/api/v1/employees').expect(401);
    });
  });

  describe('import (preview → commit)', () => {
    function csv(rows: string[]): Buffer {
      const header =
        'employeeCode,firstName,lastName,department,designation,country,currency,joinDate,basic,houseRentAllowance,specialAllowance,transportAllowance,annualBonus';
      return Buffer.from([header, ...rows].join('\n'));
    }

    it('previews new + conflict rows, then commit applies BOTH the confirmed attribute change and the salary change', async () => {
      const { token } = await signUp('import-org');
      const { departmentId, designationId } = await firstReferenceIds(token);
      const existingCode = unique('EMP');

      // Seed an existing employee with an out-of-date designation via the API.
      await request(app.getHttpServer())
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeCode: existingCode,
          firstName: 'Ravi',
          lastName: 'Kumar',
          departmentId,
          designationId,
          countryCode: 'IN',
          currencyCode: 'INR',
          joinDate: '2021-04-01',
          salary: { components: [{ type: 'BASIC', amountMinor: 8_000_000 }] },
        })
        .expect(201);

      const designations = await request(app.getHttpServer())
        .get('/api/v1/reference/designations')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const otherDesignationName: string = designations.body.find(
        (item: { id: string }) => item.id !== designationId,
      )?.name;
      expect(otherDesignationName).toBeTruthy();

      const newCode = unique('EMP');
      const sheet = csv([
        `${existingCode},Ravi,Kumar,Engineering,${otherDesignationName},IN,INR,2021-04-01,90,0,0,0,0`,
        `${newCode},Meera,Nair,Engineering,${otherDesignationName},IN,INR,2022-01-01,95,0,0,0,0`,
      ]);

      const preview = await request(app.getHttpServer())
        .post('/api/v1/employees/import/preview')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', sheet, { filename: 'test.csv', contentType: 'text/csv' })
        .expect(201);

      expect(preview.body.toInsert).toBe(1);
      expect(preview.body.conflicts).toHaveLength(1);
      expect(preview.body.conflicts[0].employeeCode).toBe(existingCode);

      const commit = await request(app.getHttpServer())
        .post('/api/v1/employees/import/commit')
        .set('Authorization', `Bearer ${token}`)
        .field('applyEmployeeCodes', existingCode)
        .attach('file', sheet, { filename: 'test.csv', contentType: 'text/csv' })
        .expect(201);

      expect(commit.body).toEqual({ inserted: 1, updated: 1, skippedConflicts: 0, failed: [] });

      const list = await request(app.getHttpServer())
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const updatedRow = list.body.data.find((row: { employeeCode: string }) => row.employeeCode === existingCode);
      expect(updatedRow.designation).toBe(otherDesignationName); // attribute change applied
      expect(updatedRow.salaryTotalMinor).toBe(9_000); // 90.00 major units (2 minor digits) -> 9,000 minor
    });
  });
});
