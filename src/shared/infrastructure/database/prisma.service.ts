import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * Thin Nest lifecycle wrapper around `PrismaClient`.
 *
 * The connection is opened only when the configured persistence driver uses
 * the database, so unit and e2e suites can keep running with the in-memory
 * adapters without requiring a MySQL server.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger: Logger;
  private readonly persistence: string;
  private connected: boolean;

  constructor(configService: ConfigService) {
    const datasourceUrl = configService.get<string>('DATABASE_URL');
    super(datasourceUrl ? { datasourceUrl } : undefined);

    this.logger = new Logger(PrismaService.name);
    this.persistence = configService.get<string>('PERSISTENCE', 'prisma');
    this.connected = false;
  }

  async onModuleInit(): Promise<void> {
    if (!this.usesDatabase()) {
      return;
    }

    await this.$connect();
    this.connected = true;
    this.logger.log('Connected to the database');
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.connected) {
      return;
    }

    await this.$disconnect();
    this.connected = false;
  }

  usesDatabase(): boolean {
    return this.persistence !== 'in-memory';
  }
}
