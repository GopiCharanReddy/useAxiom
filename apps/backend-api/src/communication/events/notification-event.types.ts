/**
 * Canonical list of all business events that can trigger communications.
 * This enum mirrors the Prisma NotificationEventType enum.
 */
export enum NotificationEventType {
  // Projects
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_ASSIGNED = 'PROJECT_ASSIGNED',
  PROJECT_DEADLINE_CHANGED = 'PROJECT_DEADLINE_CHANGED',
  PROJECT_COMPLETED = 'PROJECT_COMPLETED',

  // Goals (Milestones)
  GOAL_CREATED = 'GOAL_CREATED',
  GOAL_UPDATED = 'GOAL_UPDATED',
  GOAL_COMPLETED = 'GOAL_COMPLETED',
  GOAL_DEADLINE_CHANGED = 'GOAL_DEADLINE_CHANGED',

  // Tasks
  TASK_CREATED = 'TASK_CREATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_REASSIGNED = 'TASK_REASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_PRIORITY_CHANGED = 'TASK_PRIORITY_CHANGED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_REOPENED = 'TASK_REOPENED',
  TASK_OVERDUE = 'TASK_OVERDUE',

  // Employees
  EMPLOYEE_ADDED = 'EMPLOYEE_ADDED',
  EMPLOYEE_REMOVED = 'EMPLOYEE_REMOVED',

  // Manual & Scheduled
  MANUAL_NOTIFICATION = 'MANUAL_NOTIFICATION',
  DAILY_SUMMARY = 'DAILY_SUMMARY',
  WEEKLY_SUMMARY = 'WEEKLY_SUMMARY',
}

export enum NotificationChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

export enum NotificationDeliveryStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED',
}

/**
 * Standard template variables supported across all templates.
 * Extend as needed — the rendering engine handles unknown keys gracefully.
 */
export interface NotificationTemplateVariables {
  employeeName?: string;
  managerName?: string;
  projectName?: string;
  projectDescription?: string;
  goalName?: string;
  taskName?: string;
  taskDescription?: string;
  deadline?: string;
  priority?: string;
  status?: string;
  portalLink?: string;
  organizationName?: string;
  reason?: string;
  daysRemaining?: number | string;
  [key: string]: unknown;
}

/**
 * Payload carried in every NotificationEvent.
 * Published by EventPublisherService, stored in DB, used for template rendering.
 */
export interface NotificationEventPayload {
  organizationId: string;
  actorId: string;
  entityType: 'project' | 'task' | 'milestone' | 'user' | 'manual';
  entityId: string;
  eventType: NotificationEventType;
  variables: NotificationTemplateVariables;
}
