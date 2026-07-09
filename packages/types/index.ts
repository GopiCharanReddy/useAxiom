export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface Organization {
  id: string;
  name: string;
  whatsappBusinessId?: string;
  createdAt: Date;
  deletedAt?: Date | null;
}

export interface User {
  id: string;
  organizationId: string;
  departmentId?: string | null;
  role: UserRole;
  name: string;
  email?: string | null;
  phoneNumber: string;
  createdAt: Date;
  deletedAt?: Date | null;
}

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface Project {
  id: string;
  organizationId: string;
  managerId?: string | null;
  name: string;
  objective: string;
  status: ProjectStatus;
  targetDeadline?: Date | null;
  createdAt: Date;
  deletedAt?: Date | null;
}

export type TaskStatus = 'PROPOSED' | 'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';

export interface Task {
  id: string;
  organizationId: string;
  projectId: string;
  milestoneId?: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  estimatedHours?: number;
  createdByAi: boolean;
  createdAt: Date;
  deletedAt?: Date | null;
}

export interface Assignment {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: Date;
}

export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageDeliveryStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface WhatsAppMessage {
  id: string;
  organizationId: string;
  userId: string;
  direction: MessageDirection;
  metaMessageId?: string;
  content: string;
  deliveryStatus: MessageDeliveryStatus;
  createdAt: Date;
}
