import { execFileSync } from 'child_process';
import { join } from 'path';
import { createDB } from 'mysql-memory-server';

const PROJECT_ROOT = join(__dirname, '..', '..', '..');
const PRISMA_CLI = join(
  PROJECT_ROOT,
  'node_modules',
  'prisma',
  'build',
  'index.js',
);

export type MysqlTestDatabase = {
  url: string;
  stop: () => Promise<void>;
};

/**
 * Boots a throwaway MySQL 8.0 server and applies the committed migrations.
 *
 * 8.0 is pinned because it is the version Prisma officially supports, and
 * because the MySQL 8.4 authentication defaults are still uneven with the
 * Prisma MySQL connector.
 */
export async function startMysqlTestDatabase(): Promise<MysqlTestDatabase> {
  const database = await createDB({
    version: '8.0.x',
    dbName: 'ti_syscalls_test',
    xEnabled: 'OFF',
    logLevel: 'ERROR',
  });

  const url = `mysql://${database.username}:@127.0.0.1:${database.port}/${database.dbName}`;

  execFileSync(process.execPath, [PRISMA_CLI, 'migrate', 'deploy'], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });

  return {
    url,
    stop: () => database.stop(),
  };
}
