import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

// Mock BullMQ completely before importing AppModule to prevent Redis connections
jest.mock('@nestjs/bullmq', () => {
  class BullModule {
    static forRoot() {
      return { module: BullModule, providers: [], exports: [] };
    }
    static forRootAsync() {
      return { module: BullModule, providers: [], exports: [] };
    }
    static registerQueue(...args: any[]) {
      const providers = args.map(arg => ({
        provide: `Queue_${arg.name}`,
        useValue: {
          add: jest.fn().mockResolvedValue({ id: 'job-123' }),
          process: jest.fn(),
        }
      }));
      return {
        module: BullModule,
        providers,
        exports: providers.map(p => p.provide)
      };
    }
  }
  return {
    BullModule,
    InjectQueue: (name: string) => require('@nestjs/common').Inject(`Queue_${name}`),
    getQueueToken: (name: string) => `Queue_${name}`,
  };
});

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { NotificationsService } from './../src/notifications/notifications.service';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';

class MockJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'ADMIN',
      organizationId: 'org-123',
    };
    return true;
  }
}

describe('Developer 5 Core Business Logic (e2e)', () => {
  let app: INestApplication<App>;
  let mockPrisma: any;
  let mockNotifications: any;

  beforeEach(async () => {
    mockPrisma = {
      project: {
        create: jest.fn().mockImplementation((args) => Promise.resolve({
          id: 'project-123',
          name: args.data.name,
          objective: args.data.objective,
          status: 'PLANNING',
          organizationId: 'org-123',
          managerId: 'user-123',
          createdAt: new Date(),
          deletedAt: null,
        })),
        findFirst: jest.fn().mockImplementation((args) => Promise.resolve({
          id: args.where.id,
          name: 'Test Project',
          objective: 'Test Objective',
          status: 'PLANNING',
          organizationId: 'org-123',
          managerId: 'user-123',
          createdAt: new Date(),
          deletedAt: null,
        })),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockImplementation((args) => Promise.resolve({
          id: args.where.id,
          name: 'Test Project',
          objective: 'Test Objective',
          status: args.data.status,
          organizationId: 'org-123',
          managerId: 'user-123',
          createdAt: new Date(),
          deletedAt: null,
        })),
      },
      task: {
        create: jest.fn().mockImplementation((args) => Promise.resolve({
          id: 'task-123',
          title: args.data.title,
          description: args.data.description,
          status: args.data.status || 'PROPOSED',
          organizationId: 'org-123',
          projectId: 'project-123',
          estimatedHours: args.data.estimatedHours || null,
          createdAt: new Date(),
          deletedAt: null,
        })),
        findFirst: jest.fn().mockImplementation((args) => Promise.resolve({
          id: args.where.id,
          title: 'Test Task',
          status: 'PROPOSED',
          organizationId: 'org-123',
          projectId: 'project-123',
          estimatedHours: null,
          createdAt: new Date(),
          deletedAt: null,
          project: {
            manager: {
              phoneNumber: '+1234567890',
            },
          },
          assignments: [
            {
              user: {
                name: 'David',
              },
            },
          ],
        })),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockImplementation((args) => Promise.resolve({
          id: args.where.id,
          title: 'Test Task',
          status: args.data.status || 'PENDING',
          organizationId: 'org-123',
          projectId: 'project-123',
          estimatedHours: null,
          createdAt: new Date(),
          deletedAt: null,
        })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      milestone: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'milestone-123',
          title: 'Test Milestone',
          projectId: 'project-123',
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      assignment: {
        upsert: jest.fn().mockResolvedValue({
          id: 'assignment-123',
          taskId: 'task-123',
          userId: 'user-123',
        }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-123',
          name: 'David',
          phoneNumber: '+1234567890',
          organizationId: 'org-123',
        }),
      },
      taskDependency: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((args) => Promise.resolve({
          taskId: args.data.taskId,
          dependsOnTaskId: args.data.dependsOnTaskId,
        })),
      },
    };

    mockNotifications = {
      sendTaskAssignedAlert: jest.fn().mockResolvedValue(undefined),
      sendBlockerAlert: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtGuard)
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(NotificationsService)
      .useValue(mockNotifications)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Projects Core Logic', () => {
    it('creates a project successfully (POST /projects)', async () => {
      const res = await request(app.getHttpServer())
        .post('/projects')
        .send({
          name: 'E2E Testing Project',
          objective: 'Testing integration flows',
          targetDeadline: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.name).toBe('E2E Testing Project');
      expect(mockPrisma.project.create).toHaveBeenCalled();
    });

    it('approves a project plan (POST /projects/:id/approve)', async () => {
      const res = await request(app.getHttpServer())
        .post('/projects/project-123/approve')
        .expect(200);

      expect(res.body.status).toBe('ACTIVE');
      expect(mockPrisma.project.update).toHaveBeenCalled();
      expect(mockPrisma.task.updateMany).toHaveBeenCalled();
    });
  });

  describe('Tasks Core Logic & Transitions', () => {
    it('creates a task inside a project (POST /projects/:projectId/tasks)', async () => {
      const res = await request(app.getHttpServer())
        .post('/projects/project-123/tasks')
        .send({
          title: 'Write unit tests',
          description: 'Ensure 100% test coverage',
          estimatedHours: 5,
        })
        .expect(201);

      expect(res.body.title).toBe('Write unit tests');
      expect(mockPrisma.task.create).toHaveBeenCalled();
    });

    it('manually assigns task and triggers notification (POST /tasks/:id/assign)', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks/task-123/assign')
        .send({ userId: 'user-123' })
        .expect(200);

      expect(mockPrisma.assignment.upsert).toHaveBeenCalled();
      expect(mockNotifications.sendTaskAssignedAlert).toHaveBeenCalledWith(
        'task-123',
        '+1234567890',
        'Test Task',
        'No deadline'
      );
    });

    it('starts a task (POST /tasks/:id/start)', async () => {
      mockPrisma.task.findFirst.mockResolvedValueOnce({
        id: 'task-123',
        title: 'Test Task',
        status: 'PENDING',
        organizationId: 'org-123',
      });

      const res = await request(app.getHttpServer())
        .post('/tasks/task-123/start')
        .expect(200);

      expect(res.body.status).toBe('IN_PROGRESS');
    });

    it('blocks a task & sends notification (POST /tasks/:id/block)', async () => {
      mockPrisma.task.findFirst.mockResolvedValueOnce({
        id: 'task-123',
        title: 'Test Task',
        status: 'IN_PROGRESS',
        organizationId: 'org-123',
      });

      const res = await request(app.getHttpServer())
        .post('/tasks/task-123/block')
        .expect(200);

      expect(res.body.status).toBe('BLOCKED');
      expect(mockNotifications.sendBlockerAlert).toHaveBeenCalled();
    });

    it('marks a task completed (POST /tasks/:id/mark-complete)', async () => {
      mockPrisma.task.findFirst.mockResolvedValueOnce({
        id: 'task-123',
        title: 'Test Task',
        status: 'IN_PROGRESS',
        organizationId: 'org-123',
      });

      const res = await request(app.getHttpServer())
        .post('/tasks/task-123/mark-complete')
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
    });
  });

  describe('Task Dependencies & Graph Checks', () => {
    it('prevents adding circular dependencies', async () => {
      mockPrisma.task.findFirst
        .mockResolvedValueOnce({ id: 'task-A', status: 'PENDING', title: 'Task A', organizationId: 'org-123' })
        .mockResolvedValueOnce({ id: 'task-B', status: 'PENDING', title: 'Task B', organizationId: 'org-123' });

      mockPrisma.taskDependency.findMany.mockResolvedValueOnce([
        { taskId: 'task-B', dependsOnTaskId: 'task-A' },
      ]);

      const res = await request(app.getHttpServer())
        .post('/tasks/task-A/dependencies')
        .send({ dependsOnTaskId: 'task-B' })
        .expect(400);

      expect(res.body.message).toContain('Circular dependency');
    });
  });
});
