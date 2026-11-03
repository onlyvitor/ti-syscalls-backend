import { randomUUID } from 'crypto';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_SALT_ROUNDS = 12;

/**
 * Creates (or promotes) the first administrator.
 *
 * Registration always creates a `user`, so without this seed a fresh database
 * has no one able to promote roles or delete users.
 */
async function main(): Promise<void> {
  const email = readRequired('ADMIN_EMAIL').toLowerCase();
  const password = readRequired('ADMIN_PASSWORD');
  const name = process.env.ADMIN_NAME?.trim() || 'Administrator';

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must have at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email },
    create: {
      id: randomUUID(),
      name,
      email,
      passwordHash,
      role: UserRole.admin,
    },
    update: {
      name,
      passwordHash,
      role: UserRole.admin,
    },
  });

  console.log(`Admin ready: ${admin.email} (${admin.id})`);
}

function readRequired(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} environment variable is required to seed the admin user`,
    );
  }

  return value;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
