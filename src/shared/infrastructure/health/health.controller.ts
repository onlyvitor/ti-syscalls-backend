import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from 'src/auth/infrastructure/decorators/public.decorator';
import { HealthReport, HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Public so infrastructure probes do not need credentials. Answers `200`
   * when every dependency is reachable and `503` otherwise.
   */
  @Public()
  @Get()
  async check(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthReport> {
    const report = await this.healthService.check();

    response.status(
      report.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
    );

    return report;
  }
}
