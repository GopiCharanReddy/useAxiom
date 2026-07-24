import { ILlmProvider } from './provider.interface';
import { LLMConfig, LLMResponse, Message } from './types';

export class MockLlmProvider implements ILlmProvider {
  name = 'mock';

  async generateResponse(messages: Message[], config?: LLMConfig): Promise<LLMResponse> {
    const lastMessage = messages[messages.length - 1];

    // If the last message is a tool response, finish the loop with a summary text
    if (lastMessage?.role === 'tool') {
      return {
        content: `Tool executed successfully. Result: ${lastMessage.content}`,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    }

    // Check if tools are configured and trigger appropriate mock tool call
    if (config?.tools && config.tools.length > 0) {
      const prompt = lastMessage?.content.toLowerCase() || '';

      if (prompt.includes('workload')) {
        return {
          content: '',
          toolCalls: [
            {
              id: 'call-w1',
              type: 'function',
              function: { name: 'get_employee_workloads', arguments: '{}' },
            },
          ],
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        };
      }

      if (prompt.includes('skill')) {
        return {
          content: '',
          toolCalls: [
            {
              id: 'call-s1',
              type: 'function',
              function: { name: 'get_employee_skills', arguments: '{}' },
            },
          ],
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        };
      }

      if (prompt.includes('mark') || prompt.includes('update')) {
        return {
          content: '',
          toolCalls: [
            {
              id: 'call-u1',
              type: 'function',
              function: {
                name: 'update_task_status',
                arguments: '{"taskId":"task-102","status":"COMPLETED"}',
              },
            },
          ],
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        };
      }

      if (prompt.includes('send') || prompt.includes('whatsapp')) {
        return {
          content: '',
          toolCalls: [
            {
              id: 'call-m1',
              type: 'function',
              function: {
                name: 'send_whatsapp_message',
                arguments: '{"employeeId":"dev-3","message":"Hello from agent!"}',
              },
            },
          ],
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        };
      }

      if (prompt.includes('flag') || prompt.includes('risk')) {
        return {
          content: '',
          toolCalls: [
            {
              id: 'call-r1',
              type: 'function',
              function: {
                name: 'flag_project_at_risk',
                arguments:
                  '{"projectId":"project-99","riskScore":85,"reasoning":"Critical blocker."}',
              },
            },
          ],
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        };
      }
    }

    return {
      content: '[Mock Text Output] Successful mock LLM response.',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  async generateStructuredResponse<T>(
    messages: Message[],
    schema: any,
    config?: LLMConfig,
  ): Promise<T> {
    // 1. Detect if it's Assignment Agent calling (check for 'assignments' array schema)
    if (schema.properties?.assignments) {
      return {
        assignments: [
          {
            taskId: 'task-101',
            assigneeId: 'dev-2',
            rationale: 'Dev 2 has NestJS skills and lowest workload.',
          },
          {
            taskId: 'task-102',
            assigneeId: 'dev-3',
            rationale: 'Dev 3 is the Frontend Lead and has Tailwind skills.',
          },
        ],
      } as unknown as T;
    }

    // 2. Detect if it's Conversation Agent calling (check for 'intent' schema)
    if (schema.properties?.intent) {
      const userMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      const lower = userMessage.toLowerCase();

      // 1. Greetings & Openers
      if (
        /^(hi|hii|hello|hey|greetings|help|njh|who are you|what can you do)$/i.test(lower) ||
        lower === 'hi' ||
        lower === 'hii' ||
        lower === 'hello' ||
        lower === 'hey'
      ) {
        return {
          reply:
            'Hello! I am Axiom Assistant, your AI project management co-pilot. I can help you track project deadlines, assign projects to employees, monitor team workloads, flag project risks, and automatically dispatch daily WhatsApp reminders. How can I assist you with your workspace today?',
          intent: 'QUESTION',
          confidenceScore: 0.98,
          extractedParameters: {},
        } as unknown as T;
      }

      // 2. Milestone 2 / Delays
      if (lower.includes('milestone 2') || lower.includes('delayed') || lower.includes('delay')) {
        return {
          reply:
            'Milestone 2 is currently delayed by 3 days due to pending backend API updates in Task #42.',
          intent: 'DELAYED',
          confidenceScore: 0.92,
          extractedParameters: {
            delayReason: 'Pending backend API updates in Task #42.',
            estimatedCompletionDate: '2026-07-28',
          },
        } as unknown as T;
      }

      // 3. Blocked / Dave
      if (lower.includes('dave') || lower.includes('blocked')) {
        return {
          reply:
            'Dave has 2 tasks currently blocked: Task #105 (Dashboard Layout) and Task #108 (Notification Queue).',
          intent: 'BLOCKED',
          confidenceScore: 0.95,
          extractedParameters: {
            blockReason: 'Waiting on design approval and Redis queue configuration.',
          },
        } as unknown as T;
      }

      // 4. Sarah / Ping
      if (lower.includes('sarah') || lower.includes('ping')) {
        return {
          reply:
            'I have dispatched a ping to Sarah requesting an update on Task #89 (Payment Gateway Integration).',
          intent: 'OTHER',
          confidenceScore: 0.88,
          extractedParameters: {},
        } as unknown as T;
      }

      // 5. Plan / Review
      if (lower.includes('plan') || lower.includes('draft') || lower.includes('review')) {
        return {
          reply:
            'The draft project plan for Sprint 3 has been reviewed. All 4 milestones have an overall risk score of 25 (Low).',
          intent: 'COMPLETED',
          confidenceScore: 0.94,
          extractedParameters: {},
        } as unknown as T;
      }

      // 6. Projects / Goals / Deadlines
      if (
        lower.includes('project') ||
        lower.includes('goal') ||
        lower.includes('status') ||
        lower.includes('deadline')
      ) {
        return {
          reply:
            'Here is your current project workspace summary:\n\n• **Mobile Banking Dashboard** (High Priority) — Target Deadline: 30 July 2026 (6 days remaining). Progress: 60%. Status: Active.\n• **Payment Gateway Integration** (Medium Priority) — Target Deadline: 05 August 2026. Progress: 40%.\n\nAutomatic daily AI WhatsApp reminders are actively tracking progress for assigned team members.',
          intent: 'QUESTION',
          confidenceScore: 0.95,
          extractedParameters: {},
        } as unknown as T;
      }

      // 7. Team / Employee / Workloads
      if (
        lower.includes('employee') ||
        lower.includes('team') ||
        lower.includes('workload') ||
        lower.includes('rahul') ||
        lower.includes('assignee')
      ) {
        return {
          reply:
            'Here is your current team workload overview:\n\n• **Rahul Sharma** (EMP-005 | +918105670193): 2 active projects (Mobile Banking Dashboard, Payment Gateway). Status: Active\n• **Sarah Jenkins** (EMP-002 | +19998887777): 1 active project. Status: On Track\n• **David Miller** (Manager Lead): Workspace Manager\n\nWould you like me to assign a project or trigger a WhatsApp reminder for an employee?',
          intent: 'QUESTION',
          confidenceScore: 0.95,
          extractedParameters: {},
        } as unknown as T;
      }

      // 8. Reminders / WhatsApp
      if (
        lower.includes('reminder') ||
        lower.includes('whatsapp') ||
        lower.includes('trigger') ||
        lower.includes('schedule')
      ) {
        return {
          reply:
            'Automatic AI WhatsApp Reminders are enabled! Daily reminders are dispatched automatically at your configured time (default 09:00 AM) based on your selected AI Tone (Professional, Friendly, or Strict). You can also create a new reminder schedule or click **Trigger Now** on the **Automatic Reminders** dashboard page.',
          intent: 'QUESTION',
          confidenceScore: 0.95,
          extractedParameters: {},
        } as unknown as T;
      }

      // 9. Assign / Create / Add
      if (lower.includes('assign') || lower.includes('create') || lower.includes('add')) {
        return {
          reply:
            'To assign a project or schedule reminders:\n1. Click **+ Create Schedule** on the Automatic Reminders page or **New Project Goal** on your Projects dashboard.\n2. Enter the Employee Name, Phone Number (+918105670193), Project Name, and Target Deadline.\n3. Axiom Assistant will immediately notify the employee on WhatsApp and track daily progress until completion!',
          intent: 'QUESTION',
          confidenceScore: 0.95,
          extractedParameters: {},
        } as unknown as T;
      }

      // Default dynamic context-aware response for open-ended queries
      const cleanMessage = userMessage.replace(/^Message:\s*"/, '').replace(/"$/, '');
      return {
        reply: `I have received your query: "${cleanMessage}".\n\nAxiom Assistant is actively tracking your workspace projects, employee workloads, and automatic WhatsApp reminders. How can I help you manage your team today?`,
        intent: 'QUESTION',
        confidenceScore: 0.9,
        extractedParameters: {},
      } as unknown as T;
    }

    // 3. Detect if it's Reporting Agent calling (check for 'riskScore' schema)
    if (schema.properties?.riskScore) {
      return {
        riskScore: 35,
        riskLevel: 'MEDIUM',
        reasoning:
          'Project has one blocked task on the critical path, but other milestones are on track.',
        suggestedActionItems: [
          'Review blocked Figma design task #12.',
          'Reassign API integration to Dev 2 to accelerate timeline.',
        ],
      } as unknown as T;
    }

    // 4. Default fallback: Planner Agent output
    return {
      milestones: [
        {
          name: 'Sprint 1: Base Platform & Identity',
          tasks: [
            {
              name: 'Setup Monorepo',
              description: 'Configure Turborepo, pnpm workspaces, and base tsconfig/eslint rules.',
              estimatedHours: 8,
              requiredSkills: ['DevOps', 'TypeScript', 'pnpm'],
            },
            {
              name: 'Scaffold NestJS API',
              description: 'Initialize NestJS app-api modules and global exception filters.',
              estimatedHours: 6,
              requiredSkills: ['NestJS', 'TypeScript'],
            },
          ],
        },
        {
          name: 'Sprint 2: Authentication & Multi-Tenancy',
          tasks: [
            {
              name: 'Database migrations',
              description: 'Define Prisma schemas for User, Organization, and Tenant limits.',
              estimatedHours: 4,
              requiredSkills: ['PostgreSQL', 'Prisma'],
            },
          ],
        },
      ],
    } as unknown as T;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return Array(1536)
      .fill(0)
      .map(() => Math.random());
  }
}

export function generateAiReminderMessage(params: {
  employeeName: string;
  projectName: string;
  deadline: string;
  daysRemaining: number;
  aiTone?: 'Professional' | 'Friendly' | 'Strict' | string;
  managerName?: string;
}): string {
  const tone = params.aiTone || 'Professional';
  const name = params.employeeName || 'Team Member';
  const project = params.projectName || 'Assigned Project';
  const days = params.daysRemaining;
  const deadline = params.deadline || 'Upcoming';

  const daysText =
    days < 0
      ? `is currently OVERDUE by ${Math.abs(days)} day(s)`
      : days === 0
        ? 'is due TODAY'
        : days === 1
          ? 'is due TOMORROW (1 day remaining)'
          : `has ${days} days remaining until deadline (${days} days remaining)`;

  if (tone === 'Friendly') {
    return (
      `Hi ${name}! 👋\n\n` +
      `Hope you're having a great day! Here is your quick friendly project update from Axiom:\n\n` +
      `📌 Project: ${project}\n` +
      `⏳ Status: ${daysText}\n` +
      `📅 Target Date: ${deadline}\n\n` +
      `Keep up the fantastic work! If you need any assistance or run into any blockers, just reply here.\n\n` +
      `Best,\nAxiom Assistant 🚀`
    );
  }

  if (tone === 'Strict') {
    return (
      `ATTENTION: ${name.toUpperCase()}\n\n` +
      `Urgent Project Status Update from Axiom Engine:\n\n` +
      `📌 Project: ${project}\n` +
      `🚨 Deadline Notice: ${daysText}\n` +
      `📅 Deadline: ${deadline}\n\n` +
      `Please ensure all pending tasks are completed immediately. If any issue is causing delays, report it to your manager without delay.\n\n` +
      `Axiom Control System`
    );
  }

  // Default: Professional
  return (
    `Hello ${name},\n\n` +
    `This is your daily project reminder from Axiom.\n\n` +
    `• Project: ${project}\n` +
    `• Deadline: ${deadline}\n` +
    `• Time Remaining: ${days < 0 ? `${Math.abs(days)} days overdue` : `${days} days`}\n\n` +
    `Please ensure your project is progressing according to schedule. If you expect any delays, kindly inform your manager.\n\n` +
    `Best regards,\nAxiom Assistant`
  );
}
