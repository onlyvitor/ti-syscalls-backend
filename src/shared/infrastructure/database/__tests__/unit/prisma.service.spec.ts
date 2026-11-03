import { ConfigService } from '@nestjs/config';
import { describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma.service';

const configService = (
  values: Record<string, string | undefined>,
): ConfigService =>
  ({
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  }) as unknown as ConfigService;

describe('PrismaService Unit Tests', () => {
  describe('usesDatabase', () => {
    it('should use the database when persistence is not set', () => {
      const service = new PrismaService(configService({}));

      expect(service.usesDatabase()).toBe(true);
    });

    it('should use the database when persistence is prisma', () => {
      const service = new PrismaService(
        configService({ PERSISTENCE: 'prisma' }),
      );

      expect(service.usesDatabase()).toBe(true);
    });

    it('should skip the database when persistence is in-memory', () => {
      const service = new PrismaService(
        configService({ PERSISTENCE: 'in-memory' }),
      );

      expect(service.usesDatabase()).toBe(false);
    });
  });

  describe('onModuleInit', () => {
    it('should connect when the database is used', async () => {
      const service = new PrismaService(configService({}));
      const connect = jest
        .spyOn(service, '$connect')
        .mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(connect).toHaveBeenCalledTimes(1);
    });

    it('should not connect in in-memory mode', async () => {
      const service = new PrismaService(
        configService({ PERSISTENCE: 'in-memory' }),
      );
      const connect = jest
        .spyOn(service, '$connect')
        .mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(connect).not.toHaveBeenCalled();
    });

    it('should propagate connection failures', async () => {
      const service = new PrismaService(configService({}));
      jest
        .spyOn(service, '$connect')
        .mockRejectedValue(new Error('connection refused'));

      await expect(service.onModuleInit()).rejects.toThrow(
        'connection refused',
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect after a successful connection', async () => {
      const service = new PrismaService(configService({}));
      jest.spyOn(service, '$connect').mockResolvedValue(undefined);
      const disconnect = jest
        .spyOn(service, '$disconnect')
        .mockResolvedValue(undefined);

      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(disconnect).toHaveBeenCalledTimes(1);
    });

    it('should not disconnect when it never connected', async () => {
      const service = new PrismaService(
        configService({ PERSISTENCE: 'in-memory' }),
      );
      const disconnect = jest
        .spyOn(service, '$disconnect')
        .mockResolvedValue(undefined);

      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(disconnect).not.toHaveBeenCalled();
    });

    it('should only disconnect once', async () => {
      const service = new PrismaService(configService({}));
      jest.spyOn(service, '$connect').mockResolvedValue(undefined);
      const disconnect = jest
        .spyOn(service, '$disconnect')
        .mockResolvedValue(undefined);

      await service.onModuleInit();
      await service.onModuleDestroy();
      await service.onModuleDestroy();

      expect(disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
