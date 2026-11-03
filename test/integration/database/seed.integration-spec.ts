import { execFileSync } from 'child_process';
import { join } from 'path';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  MysqlTestDatabase,
  startMysqlTestDatabase,
} from '../support/mysql-test-database';

jest.setTimeout(300000);

const PROJECT_ROOT = join(__dirname, '..', '..', '..');
const PRISMA_CLI = join(
  PROJECT_ROOT,
  'node_modules',
  'prisma',
  'build',
  'index.js',
);

const adminEnv = {
  ADMIN_NAME: 'Root Admin',
  ADMIN_EMAIL: 'Admin@Example.com',
  ADMIN_PASSWORD: 'admin-password-123',
};

const SEEDED_EMAIL = 'admin@example.com';

describe('admin seed (integration)', () => {
  let database: MysqlTestDatabase;
  let prisma: PrismaClient;

  const runSeed = (overrides: Record<string, string> = {}): void => {
    execFileSync(process.execPath, [PRISMA_CLI, 'db', 'seed'], {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        DATABASE_URL: database.url,
        ...adminEnv,
        ...overrides,
      },
      stdio: 'pipe',
    });
  };

  beforeAll(async () => {
    database = await startMysqlTestDatabase();
    prisma = new PrismaClient({ datasourceUrl: database.url });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await database?.stop();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should create an admin with a hashed password', async () => {
    runSeed();

    const admin = await prisma.user.findUnique({
      where: { email: SEEDED_EMAIL },
    });

    expect(admin).not.toBeNull();
    expect(admin?.name).toBe('Root Admin');
    expect(admin?.role).toBe('admin');
    expect(admin?.passwordHash).not.toBe(adminEnv.ADMIN_PASSWORD);
    await expect(
      bcrypt.compare(adminEnv.ADMIN_PASSWORD, admin?.passwordHash ?? ''),
    ).resolves.toBe(true);
  });

  it('should normalize the configured e-mail', async () => {
    runSeed({ ADMIN_EMAIL: '  MIXED.CASE@EXAMPLE.COM ' });

    await expect(
      prisma.user.findUnique({ where: { email: 'mixed.case@example.com' } }),
    ).resolves.toMatchObject({ role: 'admin' });
  });

  it('should be idempotent and promote an existing user', async () => {
    runSeed();
    runSeed({ ADMIN_NAME: 'Renamed Admin' });

    const users = await prisma.user.findMany();

    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({
      email: SEEDED_EMAIL,
      name: 'Renamed Admin',
      role: 'admin',
    });
  });

  it('should reject a password shorter than 8 characters', () => {
    expect(() => runSeed({ ADMIN_PASSWORD: 'short' })).toThrow();
  });

  it('should require the admin credentials', () => {
    expect(() => runSeed({ ADMIN_EMAIL: '' })).toThrow();
  });
});
