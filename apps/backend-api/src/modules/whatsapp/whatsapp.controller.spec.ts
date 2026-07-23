import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappController } from './whatsapp.controller';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('WhatsappController', () => {
  let controller: WhatsappController;
  let mockQueue: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'WHATSAPP_VERIFY_TOKEN') return 'test_token';
        if (key === 'WHATSAPP_APP_SECRET') return 'test_secret';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsappController],
      providers: [
        {
          provide: getQueueToken('incoming_messages'),
          useValue: mockQueue,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<WhatsappController>(WhatsappController);
  });

  describe('verifyWebhook', () => {
    it('should return challenge code if token matches', () => {
      const challenge = '12345';
      const result = controller.verifyWebhook('subscribe', 'test_token', challenge);
      expect(result).toBe(challenge);
    });

    it('should throw Forbidden exception if token does not match', () => {
      expect(() => {
        controller.verifyWebhook('subscribe', 'wrong_token', '12345');
      }).toThrow(new HttpException('Forbidden', HttpStatus.FORBIDDEN));
    });
  });

  describe('handleWebhook', () => {
    it('should add payload to queue and return status queued', async () => {
      const payload = { entry: [{ id: '123' }] };
      const mockReq = {} as any;
      const result = await controller.handleWebhook(mockReq, payload, 'sha256=abcdef');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process_webhook',
        expect.objectContaining({
          payload,
        }),
        expect.any(Object),
      );
      expect(result).toEqual({ status: 'queued' });
    });
  });
});
