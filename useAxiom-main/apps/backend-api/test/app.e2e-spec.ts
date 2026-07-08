import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('useAxiom Backend Routes (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  describe('Project routes', () => {
    it('POST /api/v1/projects (Create Project)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/projects')
        .send({
          name: 'Social Media Campaign',
          objective: 'Launch product brand awareness',
          target_deadline: '2026-10-15',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.status).toBe('PLANNING');
          expect(res.body.name).toBe('Social Media Campaign');
          expect(res.body.objective).toBe('Launch product brand awareness');
          expect(res.body.target_deadline).toBe('2026-10-15');
        });
    });

    it('POST /api/v1/projects/:id/approve-plan (Approve Project Plan)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/projects/proj_test123/approve-plan')
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Plan approved successfully');
          expect(res.body.projectId).toBe('proj_test123');
        });
    });

    it('POST /api/v1/projects/:id/generate-plan (Generate Project Plan)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/projects/proj_test123/generate-plan')
        .expect(202)
        .expect((res) => {
          expect(res.body.message).toBe('Plan generation triggered');
          expect(res.body.jobId).toBeDefined();
          expect(res.body.projectId).toBe('proj_test123');
        });
    });
  });

  describe('Task routes', () => {
    it('POST /api/v1/tasks/:id/approve (Approve Task)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/tasks/task_test456/approve')
        .send({
          assignee_id_override: 'emp_dev5',
          estimated_hours_override: 12,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Task approved successfully');
          expect(res.body.taskId).toBe('task_test456');
          expect(res.body.assignee_id_override).toBe('emp_dev5');
          expect(res.body.estimated_hours_override).toBe(12);
        });
    });
  });

  describe('Analytics routes', () => {
    it('GET /api/v1/analytics/dashboard (Get Dashboard Stats)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/analytics/dashboard?timeframe=30d')
        .expect(200)
        .expect((res) => {
          expect(res.body.active_projects).toBe(3);
          expect(res.body.blocked_tasks).toBe(1);
          expect(res.body.ai_interventions_count).toBe(5);
          expect(res.body.team_velocity).toBe(85);
          expect(res.body.timeframe).toBe('30d');
        });
    });

    it('GET /api/v1/analytics/team-workload (Get Team Workload)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/analytics/team-workload')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('workloads');
          expect(Array.isArray(res.body.workloads)).toBe(true);
          expect(res.body.workloads[0]).toEqual({
            employee_id: 'emp_1',
            active_tasks: 2,
            capacity_percentage: 40,
          });
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});

