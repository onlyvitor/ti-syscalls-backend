import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Exposes the Prisma client to any module that needs a database adapter.
 * Global so feature modules do not have to import it explicitly.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
