import { INestApplication, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from 'src/shared/infrastructure/http/global-exception.filter';

/**
 * Single place where HTTP-level policies are applied, so `main.ts` and e2e
 * tests always run the app with the same configuration.
 */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
}
