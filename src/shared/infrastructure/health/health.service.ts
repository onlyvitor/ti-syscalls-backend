import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';

export type DatabaseHealthStatus = 'up' | 'down' | 'skipped';

export type HealthReport = {
  status: 'ok' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: {
      status: DatabaseHealthStatus;
      driver: 'prisma' | 'in-memory';
      latencyMs: number | null;
    };
  };
};

/**
 * Reports whether the application can reach its persistence layer.
 *
 * The health check runs a trivial query through Prisma instead of only
 * checking that the process is alive, so a lost database connection is
 * visible to orchestrators and load balancers.
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthReport> {
    const database = await this.checkDatabase();

    return {
      status: database.status === 'down' ? 'error' : 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      checks: { database },
    };
  }

  private async checkDatabase(): Promise<HealthReport['checks']['database']> {
    if (!this.prisma.usesDatabase()) {
      return { status: 'skipped', driver: 'in-memory', latencyMs: null };
    }

    const startedAt = process.hrtime.bigint();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      return {
        status: 'up',
        driver: 'prisma',
        latencyMs: Number(elapsedMs.toFixed(2)),
      };
    } catch (error) {
      this.logger.error('Database health check failed', error as Error);

      return { status: 'down', driver: 'prisma', latencyMs: null };
    }
  }
}
