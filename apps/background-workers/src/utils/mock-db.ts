export interface MockTask {
  id: string;
  title: string;
  deadline: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
  assigneePhone: string;
  assigneeName: string;
}

export function getMockTasks(): MockTask[] {
  const now = new Date();

  return [
    {
      id: 'task-101',
      title: 'Configure Target Audience Group',
      deadline: new Date(now.getTime() + 1.5 * 60 * 60 * 1000), // 1.5 hours from now (Approaching < 2 hours)
      status: 'IN_PROGRESS',
      assigneePhone: '+0987654321',
      assigneeName: 'Sarah',
    },
    {
      id: 'task-102',
      title: 'Upload Graphics Assets',
      deadline: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago (Overdue / Missed)
      status: 'BLOCKED',
      assigneePhone: '+1234567890',
      assigneeName: 'David',
    },
    {
      id: 'task-103',
      title: 'Draft Campaign Copy',
      deadline: new Date(now.getTime() + 5 * 60 * 60 * 1000), // 5 hours from now (Safe)
      status: 'PENDING',
      assigneePhone: '+0987654321',
      assigneeName: 'Sarah',
    },
    {
      id: 'task-104',
      title: 'Initial Concept Review',
      deadline: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Completed in past (Should be ignored)
      status: 'COMPLETED',
      assigneePhone: '+1234567890',
      assigneeName: 'David',
    },
  ];
}
