import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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

type ErrorOutput = {
  statusCode?: number;
  message?: string | string[];
  details?: unknown;
};

const asUser = (response: Response): UserOutput => response.body as UserOutput;
const asSearch = (response: Response): SearchUsersOutput =>
  response.body as SearchUsersOutput;
const asError = (response: Response): ErrorOutput =>
  response.body as ErrorOutput;

describe('Users (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a user through the registration use case', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          password: 'secretPassword123',
        })
        .expect(201);

      const body = asUser(response);
      expect(body.id).toBeDefined();
      expect(body.name).toBe('Jane Doe');
      expect(body.email).toBe('jane.doe@example.com');
      expect(body.role).toBe(UserRole.USER);
      expect(body.password).toBeUndefined();
    });

    it('should persist the created user so it can be found later', async () => {
      const created = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Persisted User',
          email: 'persisted@example.com',
          password: 'secretPassword123',
        })
        .expect(201);

      const found = await request(app.getHttpServer())
        .get(`/users/${asUser(created).id}`)
        .expect(200);

      expect(asUser(found).email).toBe('persisted@example.com');
    });

    it('should respond 409 when the email already exists', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'First User',
          email: 'duplicate@example.com',
          password: 'secretPassword123',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          password: 'anotherPassword123',
        })
        .expect(409);

      const error = asError(response);
      expect(error.statusCode).toBe(409);
      expect(error.message).toContain('duplicate@example.com');
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
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Weak password',
          email: 'weak@example.com',
          password: '1234567',
        })
        .expect(400);
    });

    it('should respond 400 when the email format is invalid', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'secretPassword123',
        })
        .expect(400);
    });
  });

  describe('GET /users', () => {
    it('should list users with pagination metadata', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Listed User',
          email: 'listed@example.com',
          password: 'secretPassword123',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      const body = asSearch(response);
      expect(body.total).toBe(1);
      expect(body.currentPage).toBe(1);
      expect(body.perPage).toBe(15);
      expect(body.items).toHaveLength(1);
      expect(body.items[0]).not.toHaveProperty('password');
    });

    it('should filter by query, name, email and role', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Search Target',
          email: 'search.target@example.com',
          password: 'secretPassword123',
        })
        .expect(201);
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Other User',
          email: 'other@example.com',
          password: 'secretPassword123',
        })
        .expect(201);

      const byQuery = await request(app.getHttpServer())
        .get('/users?query=search')
        .expect(200);
      expect(asSearch(byQuery).total).toBe(1);

      const byName = await request(app.getHttpServer())
        .get('/users?name=Other')
        .expect(200);
      expect(asSearch(byName).total).toBe(1);

      const byRole = await request(app.getHttpServer())
        .get('/users?role=technician')
        .expect(200);
      expect(asSearch(byRole).total).toBe(0);
    });

    it('should respond 400 when filters are invalid', async () => {
      await request(app.getHttpServer()).get('/users?role=wizard').expect(400);

      await request(app.getHttpServer()).get('/users?page=zero').expect(400);
    });
  });

  it('GET /users/:id should respond 404 for an unknown id', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/00000000-0000-4000-8000-000000009999')
      .expect(404);

    expect(asError(response).message).toBe('User not found');
  });

  describe('PATCH /users/:id', () => {
    let userId: string;

    beforeEach(async () => {
      const created = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Patch User',
          email: 'patch.user@example.com',
          password: 'secretPassword123',
        })
        .expect(201);
      userId = asUser(created).id;
    });

    it('should update the user name and role', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send({ name: 'Patched User', role: UserRole.TECHNICIAN })
        .expect(200);

      const body = asUser(response);
      expect(body.name).toBe('Patched User');
      expect(body.role).toBe(UserRole.TECHNICIAN);
      expect(body.password).toBeUndefined();
    });

    it('should respond 404 when the id does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/users/00000000-0000-4000-8000-000000009999')
        .send({ name: 'Ghost' })
        .expect(404);
    });

    it('should respond 409 when the new email belongs to another user', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Email Owner',
          email: 'email.owner@example.com',
          password: 'secretPassword123',
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send({ email: 'email.owner@example.com' })
        .expect(409);
    });

    it('should respond 400 when no updatable field is sent', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send({})
        .expect(400);
    });

    it('should reject an unknown role with 400', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send({ role: 'wizard' })
        .expect(400);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should remove the user with 204 and make it unreachable', async () => {
      const created = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Doomed User',
          email: 'doomed@example.com',
          password: 'secretPassword123',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/users/${asUser(created).id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/users/${asUser(created).id}`)
        .expect(404);
    });

    it('should respond 404 when the id does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/users/00000000-0000-4000-8000-000000009999')
        .expect(404);
    });
  });
});
