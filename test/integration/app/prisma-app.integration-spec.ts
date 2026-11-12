import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from 'src/shared/infrastructure/app-setup';
import { UserRole } from 'src/users/domain/entities/user.entity';
import {
  MysqlTestDatabase,
  startMysqlTestDatabase,
} from '../support/mysql-test-database';

jest.setTimeout(300000);

type UserOutput = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type LoginOutput = {
  accessToken: string;
  user: UserOutput;
};

describe('AppModule with Prisma persistence (integration)', () => {
  let database: MysqlTestDatabase;
  let app: INestApplication<App>;

  const createUser = (email: string) =>
    request(app.getHttpServer()).post('/users').send({
      name: 'Jane Doe',
      email,
      password: 'secretPassword123',
    });

  beforeAll(async () => {
    database = await startMysqlTestDatabase();

    process.env.PERSISTENCE = 'prisma';
    process.env.DATABASE_URL = database.url;
    process.env.JWT_SECRET = 'integration-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';

    // Required after the environment is in place because `ConfigModule.forRoot`
    // validates the environment when the module file is evaluated.
    const { AppModule } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('src/app.module') as typeof import('src/app.module');

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await database?.stop();
  });

  it('should report the database as healthy', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      checks: {
        database: {
          status: 'up',
          driver: 'prisma',
        },
      },
    });
  });

  it('should register, authenticate and read the persisted user', async () => {
    const created = await createUser('persisted@example.com').expect(201);
    const user = created.body as UserOutput;

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'persisted@example.com', password: 'secretPassword123' })
      .expect(200);
    const { accessToken } = login.body as LoginOutput;

    const found = await request(app.getHttpServer())
      .get(`/users/${user.id}`)
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(200);

    expect((found.body as UserOutput).email).toBe('persisted@example.com');
    expect((found.body as UserOutput).role).toBe(UserRole.USER);
  });

  it('should keep data after the HTTP layer handles another request', async () => {
    await createUser('duplicated@example.com').expect(201);

    const response = await createUser('duplicated@example.com').expect(409);

    expect(response.body).toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('duplicated@example.com'),
    });
  });

  it('should still enforce authorization on top of the Prisma repository', async () => {
    const created = await createUser('guarded@example.com').expect(201);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'guarded@example.com', password: 'secretPassword123' })
      .expect(200);
    const { accessToken } = login.body as LoginOutput;

    await request(app.getHttpServer())
      .get('/users')
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(403);

    expect(created.body).toEqual(
      expect.objectContaining({ id: expect.any(String) }),
    );
  });
});
