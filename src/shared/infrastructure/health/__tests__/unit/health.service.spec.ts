import { Logger } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { HealthService } from '../../health.service';

const prismaWith = (usesDatabase: boolean) => {
  const usesDatabaseMock = jest.fn(() => usesDatabase);
  const queryRawMock = jest.fn(() => Promise.resolve([{ '1': 1 }]));

  return {
    usesDatabaseMock,
    queryRawMock,
    prisma: {
      usesDatabase: usesDatabaseMock,
      $queryRaw: queryRawMock,
    } as unknown as PrismaService,
  };
};

describe('HealthService Unit Tests', () => {
  it('should skip the database check in in-memory mode', async () => {
    const { prisma, queryRawMock } = prismaWith(false);
    const service = new HealthService(prisma);

    const report = await service.check();

    expect(report.status).toBe('ok');
    expect(report.checks.database).toEqual({
      status: 'skipped',
      driver: 'in-memory',
      latencyMs: null,
    });
    expect(queryRawMock).not.toHaveBeenCalled();
    expect(typeof report.timestamp).toBe('string');
    expect(report.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('should query the database and report it as up', async () => {
    const { prisma, queryRawMock } = prismaWith(true);
    const service = new HealthService(prisma);

    const report = await service.check();

    expect(queryRawMock).toHaveBeenCalledTimes(1);
    expect(report.status).toBe('ok');
    expect(report.checks.database.status).toBe('up');
    expect(report.checks.database.driver).toBe('prisma');
    expect(report.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('should report an error when the database query fails', async () => {
    const { prisma, queryRawMock } = prismaWith(true);
    queryRawMock.mockRejectedValueOnce(new Error('connection refused'));
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const service = new HealthService(prisma);

    const report = await service.check();

    expect(report.status).toBe('error');
    expect(report.checks.database).toEqual({
      status: 'down',
      driver: 'prisma',
      latencyMs: null,
    });
  });
});
