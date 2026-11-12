import { describe, expect, it, jest } from '@jest/globals';
import type { Response } from 'express';
import { HealthController } from '../../health.controller';
import { HealthReport, HealthService } from '../../health.service';

const okReport: HealthReport = {
  status: 'ok',
  timestamp: '2026-01-01T00:00:00.000Z',
  uptimeSeconds: 10,
  checks: {
    database: { status: 'up', driver: 'prisma', latencyMs: 1 },
  },
};

const controllerWith = (report: HealthReport) => {
  const check = jest.fn(() => Promise.resolve(report));
  const status = jest.fn();

  const controller = new HealthController({
    check,
  } as unknown as HealthService);

  return {
    controller,
    check,
    response: { status } as unknown as Response,
    status,
  };
};

describe('HealthController Unit Tests', () => {
  it('should answer 200 when the report is healthy', async () => {
    const { controller, response, status } = controllerWith(okReport);

    const report = await controller.check(response);

    expect(status).toHaveBeenCalledWith(200);
    expect(report).toBe(okReport);
  });

  it('should answer 503 when a dependency is down', async () => {
    const downReport: HealthReport = {
      ...okReport,
      status: 'error',
      checks: {
        database: { status: 'down', driver: 'prisma', latencyMs: null },
      },
    };
    const { controller, response, status } = controllerWith(downReport);

    const report = await controller.check(response);

    expect(status).toHaveBeenCalledWith(503);
    expect(report).toBe(downReport);
  });
});
