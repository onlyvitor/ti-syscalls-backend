import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import type { Response } from 'supertest';
import { UserRole } from '../src/users/domain/entities/user.entity';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/shared/infrastructure/app-setup';

type UserOutput = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type SearchUsersOutput = {
  items: UserOutput[];
  total: number;
  currentPage: number;
  perPage: number;
  lastPage: number;
};

type LoginOutput = {
  accessToken: string;
  user: UserOutput;
};

type ErrorOutput = {
  statusCode?: number;
  message?: string | string[];
  details?: unknown;
};

const asUser = (response: Response): UserOutput => response.body as UserOutput;
const asSearch = (response: Response): SearchUsersOutput =>
  response.body as SearchUsersOutput;
const asLogin = (response: Response): LoginOutput =>
  response.body as LoginOutput;
const asError = (response: Response): ErrorOutput =>
  response.body as ErrorOutput;

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  const signToken = (role: UserRole, sub = `${role}-id`): Promise<string> =>
    jwtService.signAsync({
      sub,
      email: `${role}@example.com`,
      role,
    });

  const createUser = (overrides: Record<string, unknown> = {}) =>
    request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'secretPassword123',
        ...overrides,
      });

  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, password });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    jwtService = new JwtService({
      secret: process.env.JWT_SECRET ?? 'test-jwt-secret',
      signOptions: { expiresIn: '1h' },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a user through the registration use case', async () => {
      const response = await createUser().expect(201);

      const body = asUser(response);
      expect(body.id).toBeDefined();
      expect(body.name).toBe('Jane Doe');
      expect(body.email).toBe('jane.doe@example.com');
      expect(body.role).toBe(UserRole.USER);
      expect(body.password).toBeUndefined();
    });

    it('should ignore a role sent by an anonymous client', async () => {
      const response = await createUser({ role: UserRole.ADMIN }).expect(201);

      expect(asUser(response).role).toBe(UserRole.USER);
    });

    it('should persist the created user so it can be found by its owner', async () => {
      const created = await createUser().expect(201);
      const token = await signToken(UserRole.USER, asUser(created).id);

      const found = await request(app.getHttpServer())
        .get(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .expect(200);

      expect(asUser(found).email).toBe('jane.doe@example.com');
    });

    it('should respond 409 when the email already exists', async () => {
      await createUser().expect(201);

      const response = await createUser({
        name: 'Second User',
        password: 'anotherPassword123',
      }).expect(409);

      const error = asError(response);
      expect(error.statusCode).toBe(409);
      expect(error.message).toContain('jane.doe@example.com');
    });

    it('should respond 400 when a required field is missing', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'missing.name@example.com',
          password: 'secretPassword123',
        })
        .expect(400);
    });

    it('should respond 400 when the password is shorter than 8 chars', async () => {
      await createUser({ password: '1234567' }).expect(400);
    });

    it('should respond 400 when the email format is invalid', async () => {
      await createUser({ email: 'not-an-email' }).expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should authenticate a user and return an access token', async () => {
      const created = await createUser().expect(201);

      const response = await login(
        'jane.doe@example.com',
        'secretPassword123',
      ).expect(200);

      const body = asLogin(response);
      expect(body.accessToken).toEqual(expect.any(String));
      expect(body.user.id).toBe(asUser(created).id);
      expect(body.user.email).toBe('jane.doe@example.com');
      expect(body.user).not.toHaveProperty('password');
    });

    it('should normalize the e-mail before authenticating', async () => {
      await createUser().expect(201);

      const response = await login(
        '  JANE.DOE@EXAMPLE.COM ',
        'secretPassword123',
      ).expect(200);

      expect(asLogin(response).user.email).toBe('jane.doe@example.com');
    });

    it('should respond 401 when the password is wrong', async () => {
      await createUser().expect(201);

      const response = await login(
        'jane.doe@example.com',
        'wrong-password',
      ).expect(401);

      expect(asError(response).message).toBe('Invalid email or password');
    });

    it('should respond 401 when the e-mail does not exist', async () => {
      const response = await login(
        'unknown@example.com',
        'secretPassword123',
      ).expect(401);

      expect(asError(response).message).toBe('Invalid email or password');
    });

    it('should respond 400 when the payload is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email' })
        .expect(400);
    });

    it('should issue a token that authenticates protected routes', async () => {
      await createUser().expect(201);
      const loginResponse = await login(
        'jane.doe@example.com',
        'secretPassword123',
      ).expect(200);

      await request(app.getHttpServer())
        .get(`/users/${asLogin(loginResponse).user.id}`)
        .set(bearer(asLogin(loginResponse).accessToken))
        .expect(200);
    });
  });

  describe('authentication guard', () => {
    it('should keep GET / public', async () => {
      await request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('health checker');
    });

    it('should keep GET /health public', async () => {
      await request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((response) => {
          expect(response.body).toMatchObject({ status: 'ok' });
        });
    });

    it('should keep POST /users public', async () => {
      await createUser().expect(201);
    });

    it('should respond 401 when no token is provided', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });

    it('should respond 401 when the token is invalid', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set(bearer('not-a-token'))
        .expect(401);
    });

    it('should respond 401 when the token is expired', async () => {
      const expiredToken = await jwtService.signAsync(
        { sub: 'admin-id', email: 'admin@example.com', role: UserRole.ADMIN },
        { expiresIn: '-1s' },
      );

      await request(app.getHttpServer())
        .get('/users')
        .set(bearer(expiredToken))
        .expect(401);
    });
  });

  describe('GET /users', () => {
    it('should forbid a regular user from listing users', async () => {
      const token = await signToken(UserRole.USER);

      await request(app.getHttpServer())
        .get('/users')
        .set(bearer(token))
        .expect(403);
    });

    it('should list users with pagination metadata for a technician', async () => {
      await createUser().expect(201);
      const token = await signToken(UserRole.TECHNICIAN);

      const response = await request(app.getHttpServer())
        .get('/users')
        .set(bearer(token))
        .expect(200);

      const body = asSearch(response);
      expect(body.total).toBe(1);
      expect(body.currentPage).toBe(1);
      expect(body.perPage).toBe(15);
      expect(body.items).toHaveLength(1);
      expect(body.items[0]).not.toHaveProperty('password');
    });

    it('should filter by query, name, email and role for an admin', async () => {
      await createUser().expect(201);
      await createUser({
        name: 'Other User',
        email: 'other@example.com',
      }).expect(201);
      const token = await signToken(UserRole.ADMIN);

      const byQuery = await request(app.getHttpServer())
        .get('/users?query=jane')
        .set(bearer(token))
        .expect(200);
      expect(asSearch(byQuery).total).toBe(1);

      const byName = await request(app.getHttpServer())
        .get('/users?name=Other')
        .set(bearer(token))
        .expect(200);
      expect(asSearch(byName).total).toBe(1);

      const byEmail = await request(app.getHttpServer())
        .get('/users?email=other@example.com')
        .set(bearer(token))
        .expect(200);
      expect(asSearch(byEmail).total).toBe(1);

      const byRole = await request(app.getHttpServer())
        .get('/users?role=technician')
        .set(bearer(token))
        .expect(200);
      expect(asSearch(byRole).total).toBe(0);
    });

    it('should respond 400 when filters are invalid', async () => {
      const token = await signToken(UserRole.ADMIN);

      await request(app.getHttpServer())
        .get('/users?role=wizard')
        .set(bearer(token))
        .expect(400);

      await request(app.getHttpServer())
        .get('/users?page=zero')
        .set(bearer(token))
        .expect(400);
    });
  });

  describe('GET /users/:id', () => {
    it('should allow a user to read their own data', async () => {
      const created = await createUser().expect(201);
      const token = await signToken(UserRole.USER, asUser(created).id);

      await request(app.getHttpServer())
        .get(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .expect(200);
    });

    it('should forbid a user from reading another user', async () => {
      const created = await createUser().expect(201);
      const token = await signToken(UserRole.USER, 'another-user-id');

      await request(app.getHttpServer())
        .get(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .expect(403);
    });

    it('should allow a technician to read any user', async () => {
      const created = await createUser().expect(201);
      const token = await signToken(UserRole.TECHNICIAN);

      await request(app.getHttpServer())
        .get(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .expect(200);
    });

    it('should respond 404 for an unknown id', async () => {
      const token = await signToken(UserRole.ADMIN);

      const response = await request(app.getHttpServer())
        .get('/users/00000000-0000-4000-8000-000000009999')
        .set(bearer(token))
        .expect(404);

      expect(asError(response).message).toBe('User not found');
    });
  });

  describe('PATCH /users/:id', () => {
    it('should allow a user to update their own name and email', async () => {
      const created = await createUser().expect(201);
      const token = await signToken(UserRole.USER, asUser(created).id);

      const response = await request(app.getHttpServer())
        .patch(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .send({ name: 'Patched User', email: 'patched@example.com' })
        .expect(200);

      const body = asUser(response);
      expect(body.name).toBe('Patched User');
      expect(body.email).toBe('patched@example.com');
      expect(body.password).toBeUndefined();
    });

    it('should forbid a user from changing their own role', async () => {
      const created = await createUser().expect(201);
      const token = await signToken(UserRole.USER, asUser(created).id);

      await request(app.getHttpServer())
        .patch(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .send({ role: UserRole.ADMIN })
        .expect(403);
    });

    it('should forbid a user from updating another user', async () => {
      const created = await createUser().expect(201);
      const token = await signToken(UserRole.USER, 'another-user-id');

      await request(app.getHttpServer())
        .patch(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .send({ name: 'Hacked' })
        .expect(403);
    });

    it('should allow an admin to change another user role', async () => {
      const created = await createUser().expect(201);
      const token = await signToken(UserRole.ADMIN);

      const response = await request(app.getHttpServer())
        .patch(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .send({ role: UserRole.TECHNICIAN })
        .expect(200);

      expect(asUser(response).role).toBe(UserRole.TECHNICIAN);
      expect(asUser(response).password).toBeUndefined();
    });

    it('should respond 404 when the id does not exist', async () => {
      const token = await signToken(UserRole.ADMIN);

      await request(app.getHttpServer())
        .patch('/users/00000000-0000-4000-8000-000000009999')
        .set(bearer(token))
        .send({ name: 'Ghost' })
        .expect(404);
    });

    it('should respond 409 when the new email belongs to another user', async () => {
      const created = await createUser().expect(201);
      await createUser({
        name: 'Email Owner',
        email: 'email.owner@example.com',
      }).expect(201);
      const token = await signToken(UserRole.USER, asUser(created).id);

      await request(app.getHttpServer())
        .patch(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .send({ email: 'email.owner@example.com' })
        .expect(409);
    });

    it('should respond 400 when no updatable field is sent', async () => {
      const created = await createUser().expect(201);
      const token = await signToken(UserRole.USER, asUser(created).id);

      await request(app.getHttpServer())
        .patch(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .send({})
        .expect(400);
    });

    it('should reject an unknown role with 400', async () => {
      const created = await createUser().expect(201);
      const token = await signToken(UserRole.ADMIN);

      await request(app.getHttpServer())
        .patch(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .send({ role: 'wizard' })
        .expect(400);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should forbid a regular user from deleting a user', async () => {
      const created = await createUser().expect(201);
      const token = await signToken(UserRole.USER, asUser(created).id);

      await request(app.getHttpServer())
        .delete(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .expect(403);
    });

    it('should forbid a technician from deleting a user', async () => {
      const created = await createUser().expect(201);
      const token = await signToken(UserRole.TECHNICIAN);

      await request(app.getHttpServer())
        .delete(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .expect(403);
    });

    it('should remove the user with 204 and make it unreachable for an admin', async () => {
      const created = await createUser().expect(201);
      const token = await signToken(UserRole.ADMIN);

      await request(app.getHttpServer())
        .delete(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .expect(204);

      await request(app.getHttpServer())
        .get(`/users/${asUser(created).id}`)
        .set(bearer(token))
        .expect(404);
    });

    it('should respond 404 when the id does not exist', async () => {
      const token = await signToken(UserRole.ADMIN);

      await request(app.getHttpServer())
        .delete('/users/00000000-0000-4000-8000-000000009999')
        .set(bearer(token))
        .expect(404);
    });
  });
});
