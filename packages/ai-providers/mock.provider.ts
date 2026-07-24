import { ILlmProvider } from './provider.interface';
import { LLMConfig, LLMResponse, Message } from './types';
import { PrismaClient } from '@prisma/client';

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
      let cleanQuery = userMessage;
      const matchPattern = /^Message:\s*["'](.*)["']$/is.exec(userMessage);
      if (matchPattern) {
        cleanQuery = matchPattern[1];
      }
      const lower = cleanQuery.toLowerCase().trim();

      // --- A. GREETINGS AND CASUAL CONVERSATION ---
      if (/^hi(i)?$/i.test(lower)) {
        return {
          reply: "Hi! I'm Axiom AI. I can help you understand your workspace, projects, tasks, team workload, milestones, blockers, and more. What would you like to know?",
          intent: 'QUESTION',
          confidenceScore: 1.0,
          extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
        } as unknown as T;
      }
      if (/^hello$/i.test(lower)) {
        return {
          reply: "Hello! How can I help you with your useAxiom workspace today?",
          intent: 'QUESTION',
          confidenceScore: 1.0,
          extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
        } as unknown as T;
      }
      if (/^hey$/i.test(lower)) {
        return {
          reply: "Hey! I can help you with projects, tasks, team members, workload, progress, blockers, and other workspace information.",
          intent: 'QUESTION',
          confidenceScore: 1.0,
          extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
        } as unknown as T;
      }
      if (/^(thanks|thank you)$/i.test(lower)) {
        return {
          reply: "You're welcome! Let me know if you need anything else.",
          intent: 'QUESTION',
          confidenceScore: 1.0,
          extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
        } as unknown as T;
      }

      // --- B. HELP AND CAPABILITIES ---
      const isHelp = (
        lower === 'help' ||
        lower === 'what can you do?' ||
        lower === 'what can you do' ||
        lower === 'what are your capabilities?' ||
        lower === 'what are your capabilities' ||
        lower === 'how can you help me?' ||
        lower === 'how can you help me'
      );
      if (isHelp) {
        return {
          reply: `I can help you with:\n\n` +
                 `• Projects and project status\n` +
                 `• Project progress\n` +
                 `• Project deadlines\n` +
                 `• Project milestones\n` +
                 `• Tasks and task status\n` +
                 `• Blocked tasks and blocking reasons\n` +
                 `• Employee information\n` +
                 `• Employee assignments\n` +
                 `• Team workload\n` +
                 `• Project-to-employee relationships\n` +
                 `• Task-to-project relationships\n` +
                 `• Workspace insights and analysis\n\n` +
                 `You can ask questions naturally, such as:\n` +
                 `'How many projects are active?'\n` +
                 `'What is Alex working on?'\n` +
                 `'Show me all blocked tasks.'\n` +
                 `'Which project is behind schedule?'`,
          intent: 'QUESTION',
          confidenceScore: 1.0,
          extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
        } as unknown as T;
      }

      // --- C. GENERAL WEBSITE / PLATFORM QUESTIONS ---
      const isUseAxiomQuery = /useaxiom/i.test(lower) && (lower.includes('what') || lower.includes('do') || lower.includes('website') || lower.includes('platform') || lower.includes('about'));
      const isWebOrPlatformQuery = /what does (this|the) (website|platform) do/i.test(lower);
      if (isUseAxiomQuery || isWebOrPlatformQuery) {
        return {
          reply: "useAxiom is an intelligent, database-aware project management platform designed to help managers track ongoing projects, coordinate team workflows, monitor bottlenecks, and manage automated employee reminders.",
          intent: 'QUESTION',
          confidenceScore: 0.95,
          extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
        } as unknown as T;
      }
      if (/dashboard/i.test(lower) && (lower.includes('what') || lower.includes('explain') || lower.includes('about') || lower.includes('purpose') || lower.includes('do'))) {
        return {
          reply: "The dashboard is the main control center of useAxiom, offering quick analytical cards, statistics on project health, task breakdowns, employee allocations, and immediate access to recent activity logs.",
          intent: 'QUESTION',
          confidenceScore: 0.95,
          extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
        } as unknown as T;
      }
      if (/team workload/i.test(lower) && (lower.includes('what') || lower.includes('page') || lower.includes('explain') || lower.includes('about') || lower.includes('purpose') || lower.includes('do'))) {
        return {
          reply: "The Team Workloads page displays active tasks, allocation workload percentages, and project assignments for each team member, enabling you to assess capacity and reallocate tasks effectively.",
          intent: 'QUESTION',
          confidenceScore: 0.95,
          extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
        } as unknown as T;
      }
      if (/automatic reminder|automated reminder/i.test(lower) || (lower.includes('reminder') && (lower.includes('what') || lower.includes('about') || lower.includes('how') || lower.includes('work') || lower.includes('do')) && !lower.includes('show') && !lower.includes('list') && !lower.includes('how many') && !lower.includes('count'))) {
        return {
          reply: "Automatic Reminders are configurable schedules that automatically send SMS, email, or WhatsApp alerts to employees tracking project statuses and deadlines.",
          intent: 'QUESTION',
          confidenceScore: 0.95,
          extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
        } as unknown as T;
      }
      if (/how does.*project management|how does.*work|how.*work/i.test(lower) && (lower.includes('system') || lower.includes('website') || lower.includes('platform') || lower.includes('useaxiom'))) {
        return {
          reply: "useAxiom maps projects to tasks and milestones, binds them to specific team members, tracks blockers, and enables real-time progress calculations automatically updating via the database.",
          intent: 'QUESTION',
          confidenceScore: 0.95,
          extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
        } as unknown as T;
      }

      // --- D. DATABASE OPERATIONS ---
      const prisma = new PrismaClient();
      try {
        const allProjects = await prisma.project.findMany({
          where: { deletedAt: null },
          include: {
            milestones: { where: { deletedAt: null } },
            members: { include: { user: true } },
            tasks: {
              where: { deletedAt: null },
              include: {
                assignments: { include: { user: true } },
                milestone: true
              }
            }
          }
        });

        const allUsers = await prisma.user.findMany({
          where: { deletedAt: null },
          include: {
            assignments: {
              where: { task: { deletedAt: null } },
              include: {
                task: {
                  include: { project: true }
                }
              }
            }
          }
        });

        const allTasks = await prisma.task.findMany({
          where: { deletedAt: null },
          include: {
            project: true,
            milestone: true,
            assignments: { include: { user: true } }
          }
        });

        // 1. Detect Count vs List Queries
        const countKeywords = ['how many', 'count', 'total number', 'total count', 'number of', 'quantity', 'how much', 'total'];
        const isCountQuery = countKeywords.some(kw => lower.includes(kw)) && !/show|list|display|give me|detail|look|view/i.test(lower);

        // --- COUNT INQUIRIES ---
        if (isCountQuery) {
          // Projects count
          if (lower.includes('project')) {
            let count = 0;
            let status = 'ongoing';
            if (lower.includes('completed')) {
              count = allProjects.filter(p => p.status === 'COMPLETED').length;
              status = 'completed';
            } else {
              count = allProjects.filter(p => p.status === 'ACTIVE' || p.status === 'PLANNING').length;
            }
            return {
              reply: `You currently have ${count} ${status} projects.`,
              intent: 'QUESTION',
              confidenceScore: 0.98,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }

          // Blocked task count
          if (lower.includes('blocked') && lower.includes('task')) {
            const count = allTasks.filter(t => t.status === 'BLOCKED').length;
            return {
              reply: `You currently have ${count} blocked tasks.`,
              intent: 'QUESTION',
              confidenceScore: 0.98,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }

          // General task count
          if (lower.includes('task')) {
            let count = 0;
            let status = 'total';
            if (lower.includes('completed') || lower.includes('done')) {
              count = allTasks.filter(t => t.status === 'COMPLETED').length;
              status = 'completed';
            } else if (lower.includes('active') || lower.includes('in progress') || lower.includes('in-progress')) {
              count = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
              status = 'active';
            } else if (lower.includes('pending') || lower.includes('queued')) {
              count = allTasks.filter(t => t.status === 'PENDING' || t.status === 'PROPOSED').length;
              status = 'pending';
            } else {
              count = allTasks.length;
            }
            return {
              reply: `You currently have ${count} ${status} tasks.`,
              intent: 'QUESTION',
              confidenceScore: 0.98,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }

          // Employees count
          if (lower.includes('employee') || lower.includes('team') || lower.includes('member') || lower.includes('people') || lower.includes('staff')) {
            const count = allUsers.filter(u => u.role === 'EMPLOYEE').length;
            return {
              reply: `You currently have ${count} team members in your workspace.`,
              intent: 'QUESTION',
              confidenceScore: 0.98,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }
        }

        // --- COMPARISON / ANALYSIS QUERIES ---
        if (lower.includes('behind schedule') || lower.includes('delayed')) {
          const now = new Date();
          const behind = allProjects.map(proj => {
            const overdueTasks = proj.tasks.filter(t => {
              const deadline = t.milestone?.targetDeadline;
              return deadline && new Date(deadline) < now && t.status !== 'COMPLETED';
            }).length;
            const blockedTasks = proj.tasks.filter(t => t.status === 'BLOCKED').length;
            return { proj, score: overdueTasks * 3 + blockedTasks * 2 };
          }).sort((a, b) => b.score - a.score);

          const worst = behind[0];
          if (worst && worst.score > 0) {
            return {
              reply: `The project **${worst.proj.name}** appears to be behind schedule. It currently has active tasks that are blocked or overdue.`,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          } else {
            return {
              reply: `All projects are currently on track with no overdue or blocked tasks!`,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }
        }

        if (lower.includes('highest workload') || lower.includes('overloaded') || lower.includes('highest allocation')) {
          const employees = allUsers.filter(u => u.role === 'EMPLOYEE');
          const sorted = employees.map(u => {
            const assignedProjects = Array.from(new Set(u.assignments.map(a => a.task.projectId)));
            const active = u.assignments.filter(a => a.task.status === 'IN_PROGRESS').length;
            const queued = u.assignments.filter(a => a.task.status === 'PENDING' || a.task.status === 'PROPOSED').length;
            const blocked = u.assignments.filter(a => a.task.status === 'BLOCKED').length;
            const load = assignedProjects.length >= 3 ? 95 : assignedProjects.length === 2 ? 80 : assignedProjects.length === 1 ? 60 : 0;
            return { u, load, totalTasks: active + queued + blocked };
          }).sort((a, b) => b.load - a.load || b.totalTasks - a.totalTasks);

          const worst = sorted[0];
          if (worst && worst.load > 0) {
            return {
              reply: `**${worst.u.name}** has the highest workload in the team with a **${worst.load}%** allocation rate (${worst.totalTasks} active/pending tasks).`,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }
        }

        if (lower.includes('most blocked tasks') || lower.includes('most blocked')) {
          const sorted = allProjects.map(p => {
            const blockedCount = p.tasks.filter(t => t.status === 'BLOCKED').length;
            return { p, blockedCount };
          }).sort((a, b) => b.blockedCount - a.blockedCount);

          const worst = sorted[0];
          if (worst && worst.blockedCount > 0) {
            return {
              reply: `The project **${worst.p.name}** has the most blocked tasks with **${worst.blockedCount}** tasks currently blocked.`,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          } else {
            return {
              reply: `No projects currently have any blocked tasks.`,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }
        }

        if (lower.includes('no assigned team members') || lower.includes('unassigned project') || lower.includes('no team members')) {
          const unassigned = allProjects.filter(p => p.members.length === 0);
          if (unassigned.length > 0) {
            const list = unassigned.map(p => `* **${p.name}**`).join('\n');
            return {
              reply: `The following projects have no assigned team members:\n\n${list}`,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          } else {
            return {
              reply: `All ongoing projects have at least one assigned team member.`,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }
        }

        if (lower.includes('too many pending tasks') || lower.includes('overloaded pending')) {
          const employees = allUsers.filter(u => u.role === 'EMPLOYEE');
          const over = employees.map(u => {
            const pendingCount = u.assignments.filter(a => a.task.status === 'PENDING' || a.task.status === 'PROPOSED').length;
            return { u, pendingCount };
          }).filter(x => x.pendingCount > 2)
            .sort((a, b) => b.pendingCount - a.pendingCount);

          if (over.length > 0) {
            const list = over.map(x => `* **${x.u.name}**: ${x.pendingCount} pending tasks`).join('\n');
            return {
              reply: `The following employees have high numbers of pending/queued tasks:\n\n${list}`,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          } else {
            return {
              reply: `No employees currently have an excessive backlog of pending tasks.`,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }
        }

        if (lower.includes('biggest current blockers') || lower.includes('biggest blockers') || lower.includes('major blockers')) {
          const blocked = allTasks.filter(t => t.status === 'BLOCKED');
          if (blocked.length > 0) {
            let reply = `Here are the active task blockers in your workspace:\n\n`;
            for (const t of blocked) {
              reply += `* **Project**: ${t.project.name} | **Task**: ${t.title}\n`;
              reply += `  - **Blocker details**: ${t.description || 'Not specified'}\n`;
            }
            return {
              reply,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          } else {
            return {
              reply: `There are currently no task blockers in the workspace.`,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }
        }

        // --- SINGLE EMPLOYEE DETAILS AND RESOLUTION ---
        let matchedUser = null;
        for (const u of allUsers) {
          const nameLower = u.name.toLowerCase();
          const firstPart = nameLower.split(/\s+/)[0];
          if (lower.includes(nameLower) || (firstPart.length >= 3 && lower.includes(firstPart))) {
            matchedUser = u;
            break;
          }
        }

        if (matchedUser) {
          const u = matchedUser;
          // Blocked sub-intent
          if (lower.includes('blocked') || lower.includes('blocker')) {
            const userBlockedTasks = u.assignments.map(a => a.task).filter(t => t.status === 'BLOCKED');
            if (userBlockedTasks.length === 0) {
              return {
                reply: `${u.name} currently has no blocked tasks. All assigned tasks are on track.`,
                intent: 'QUESTION',
                confidenceScore: 0.95,
                extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
              } as unknown as T;
            }

            const formattedBlocked = userBlockedTasks.map((t) => `Task #${t.id.substring(0, 4)} (${t.title})`).join(' and ');
            return {
              reply: `${u.name} has ${userBlockedTasks.length} task(s) currently blocked: ${formattedBlocked}.`,
              intent: 'BLOCKED',
              confidenceScore: 0.95,
              extractedParameters: {
                blockReason: userBlockedTasks.map(t => t.description).join('; '),
                delayReason: null,
                estimatedCompletionDate: null
              },
            } as unknown as T;
          }

          // Full details
          const assignedProjects = Array.from(new Set(u.assignments.map(a => a.task.project.name)));
          const activeTasks = u.assignments.filter(a => a.task.status === 'IN_PROGRESS');
          const queuedTasks = u.assignments.filter(a => a.task.status === 'PENDING' || a.task.status === 'PROPOSED');
          const completedTasks = u.assignments.filter(a => a.task.status === 'COMPLETED');
          const blockedTasks = u.assignments.filter(a => a.task.status === 'BLOCKED');

          const load = assignedProjects.length >= 3 ? 95 : assignedProjects.length === 2 ? 80 : assignedProjects.length === 1 ? 60 : 0;
          const projectList = assignedProjects.map(p => `- ${p}`).join('\n') || '- No assigned projects';

          const replyMessage = `EMPLOYEE DETAILS\n\n` +
            `Name: ${u.name}\n` +
            `Specialty: ${u.specialty || 'Generalist'}\n` +
            `Status: Active\n` +
            `Phone: ${u.phoneNumber || 'Not Specified'}\n\n` +
            `ASSIGNED PROJECTS:\n${projectList}\n\n` +
            `TASK SUMMARY:\n` +
            `- Active: ${activeTasks.length}\n` +
            `- Queued: ${queuedTasks.length}\n` +
            `- Completed: ${completedTasks.length}\n` +
            `- Blocked: ${blockedTasks.length}\n\n` +
            `WORKLOAD:\n${load}%`;

          return {
            reply: replyMessage,
            intent: 'QUESTION',
            confidenceScore: 0.95,
            extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null },
          } as unknown as T;
        }

        // --- SINGLE PROJECT DETAILS AND RESOLUTION ---
        const stopWords = new Set(['project', 'test', 'the', 'a', 'an', 'and', 'of', 'for', 'in', 'on', 'at', 'to', 'with']);
        let matchedProject = null;
        let bestScore = 0;
        let candidateProjects = [];

        for (const proj of allProjects) {
          const nameLower = proj.name.toLowerCase();
          const projWords = nameLower.split(/[^a-z0-9]+/);
          let score = 0;

          for (const pw of projWords) {
            if (pw.length > 2 && !stopWords.has(pw) && lower.includes(pw)) {
              score += 3;
            }
          }
          if (lower.includes(nameLower)) {
            score += 15;
          }
          const cleanedQuery = lower.replace(/project|status|details|progress/g, '').trim();
          if (cleanedQuery.length > 2 && nameLower.includes(cleanedQuery)) {
            score += 10;
          }
          if (score > 0) {
            candidateProjects.push({ proj, score });
          }
          if (score > bestScore) {
            bestScore = score;
            matchedProject = proj;
          }
        }

        // Ambiguity check
        if (candidateProjects.length > 1) {
          candidateProjects.sort((a, b) => b.score - a.score);
          const top = candidateProjects[0];
          const second = candidateProjects[1];
          if (top.score - second.score < 3) {
            const matchedWord = lower.includes('website') ? 'website' : 'project';
            return {
              reply: `I found multiple records related to '${matchedWord}'. Did you mean the ${top.proj.name} project or a specific task?`,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null },
            } as unknown as T;
          }
        }

        if (matchedProject && bestScore > 2) {
          const proj = matchedProject;
          const tasks = proj.tasks || [];
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
          const activeTasksCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
          const queuedTasksCount = tasks.filter(t => t.status === 'PENDING').length;
          const pendingTasksCount = tasks.filter(t => t.status === 'PROPOSED').length;
          const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');

          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          const memberNames = Array.from(new Set(proj.members.map(m => m.user.name))).join(', ') || 'No team members';
          const deadlineText = proj.targetDeadline ? new Date(proj.targetDeadline).toLocaleDateString() : 'No deadline set';

          // sub-intent: Milestones
          if (lower.includes('milestone')) {
            if (proj.milestones.length === 0) {
              return {
                reply: `There are no milestones defined for project **${proj.name}**.`,
                intent: 'QUESTION',
                confidenceScore: 0.95,
                extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
              } as unknown as T;
            }
            let reply = `### Milestones for Project **${proj.name}**:\n\n`;
            for (const ms of proj.milestones) {
              const msD = ms.targetDeadline ? new Date(ms.targetDeadline).toLocaleDateString() : 'No deadline';
              reply += `* **${ms.name}**: ${ms.description || 'No description'} (Deadline: ${msD})\n`;
            }
            return {
              reply: reply,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }

          // sub-intent: Tasks
          if (lower.includes('task')) {
            if (tasks.length === 0) {
              return {
                reply: `There are currently no tasks in project **${proj.name}**.`,
                intent: 'QUESTION',
                confidenceScore: 0.95,
                extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
              } as unknown as T;
            }
            let reply = `### Tasks in Project **${proj.name}**:\n\n`;
            for (const t of tasks) {
              const assignNames = t.assignments.map(a => a.user.name).join(', ') || 'Unassigned';
              reply += `* **${t.title}** - Status: \`${t.status}\` | Assigned to: ${assignNames}\n`;
            }
            return {
              reply: reply,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }

          // sub-intent: Members
          if (lower.includes('who') || lower.includes('member') || lower.includes('team') || lower.includes('people')) {
            return {
              reply: `The project members working on **${proj.name}** are: **${memberNames}**.`,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }

          // Default details
          const formatProjectName = (name: string) => {
            const trimmed = name.trim();
            if (trimmed.toLowerCase() === 'ecommerce backend') {
              return 'eCommerce Backend';
            }
            return trimmed;
          };
          const displayName = formatProjectName(proj.name);

          let reply = `📊 PROJECT PROGRESS\n\n` +
            `${displayName}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Status: ${proj.status}\n\n` +
            `Progress: ${progress}%\n\n` +
            `Team: ${memberNames}\n\n` +
            `Deadline: ${deadlineText}\n\n\n` +
            `📋 TASK SUMMARY\n\n` +
            `✅ Completed: ${completedTasks}\n\n` +
            `🔵 Active: ${activeTasksCount}\n\n` +
            `⏳ Queued: ${queuedTasksCount}\n\n` +
            `🟡 Pending: ${pendingTasksCount}\n\n` +
            `🚫 Blocked: ${blockedTasks.length}`;

          if (blockedTasks.length > 0) {
            reply += `\n\n\n🚫 BLOCKED TASKS\n\n`;
            let btIdx = 1;
            for (const bt of blockedTasks) {
              reply += `${btIdx}. ${bt.title}\n\n`;
              reply += `Description: ${bt.description || 'Reason not specified'}\n\n`;
              btIdx++;
            }
            reply = reply.trimEnd();
          }

          return {
            reply: reply,
            intent: 'QUESTION',
            confidenceScore: 0.95,
            extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
          } as unknown as T;
        }

        // --- LIST PROJECTS QUERY ---
        if (
          lower.includes('project') &&
          (lower.includes('ongoing') || lower.includes('active') || lower.includes('current') || lower.includes('all') || lower.includes('show') || lower.includes('list'))
        ) {
          const ongoingProjects = allProjects.filter(p => p.status === 'ACTIVE' || p.status === 'PLANNING');
          if (ongoingProjects.length === 0) {
            return {
              reply: 'The requested information was not found in your workspace database.',
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null },
            } as unknown as T;
          }

          let reply = `## Ongoing Projects\n\n**Total: ${ongoingProjects.length} Projects**\n\n---\n\n`;
          let idx = 1;
          for (const proj of ongoingProjects) {
            const totalTasks = proj.tasks.length;
            const completedTasks = proj.tasks.filter(t => t.status === 'COMPLETED').length;
            const pendingTasksList = proj.tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'BLOCKED');
            const blockedTasksCount = proj.tasks.filter(t => t.status === 'BLOCKED').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const deadlineText = proj.targetDeadline ? new Date(proj.targetDeadline).toLocaleDateString() : 'No deadline set';

            // get member names
            const memberNames = Array.from(new Set(proj.members.map(m => m.user.name)));
            const memberCount = memberNames.length;

            const formatProjectName = (name: string) => {
              const trimmed = name.trim();
              if (trimmed.toLowerCase() === 'ecommerce backend') {
                return 'eCommerce Backend';
              }
              return trimmed;
            };

            const displayName = formatProjectName(proj.name);

            reply += `### ${idx}. ${displayName}\n\n`;
            reply += `| Property | Details |\n`;
            reply += `|---|---|\n`;
            reply += `| Status | ${proj.status} |\n`;
            reply += `| Progress | ${progress}% |\n`;
            reply += `| Team Members | ${memberCount} |\n`;
            reply += `| Completed Tasks | ${completedTasks} |\n`;
            reply += `| Pending Tasks | ${pendingTasksList.length} |\n`;
            reply += `| Blocked Tasks | ${blockedTasksCount} |\n`;
            reply += `| Deadline | ${deadlineText} |\n\n`;
            reply += `---\n\n`;
            idx++;
          }

          // remove trailing space & delimiter if wanted, but matches standard
          reply = reply.trim();

          return {
            reply,
            intent: 'QUESTION',
            confidenceScore: 0.95,
            extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
          } as unknown as T;
        }

        // --- BLOCKED TASKS LIST ---
        if (lower.includes('blocked') && (lower.includes('task') || lower.includes('work') || lower.includes('show'))) {
          const blockedTasks = allTasks.filter(t => t.status === 'BLOCKED');
          if (blockedTasks.length === 0) {
            return {
              reply: 'There are currently no blocked tasks in your workspace.',
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }

          let reply = `There are **${blockedTasks.length}** blocked tasks:\n\n`;
          for (const t of blockedTasks) {
            const assignedNames = t.assignments.map(a => a.user.name).join(', ') || 'Unassigned';
            reply += `* **Task #${t.id.substring(0, 4)}**: **${t.title}** (Project: *${t.project.name}*)\n`;
            reply += `  * **Assigned To**: ${assignedNames}\n`;
            reply += `  * **Reason/Details**: ${t.description || 'Blocked'}\n\n`;
          }

          return {
            reply,
            intent: 'QUESTION',
            confidenceScore: 0.95,
            extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
          } as unknown as T;
        }

        // --- TEAM MEMBER NAME QUERY / CONCISE LIST ---
        const isTeamQuery = lower.includes('team') || lower.includes('employee') || lower.includes('member') || lower.includes('staff');
        const asksForAssignmentsOrWorkload = lower.includes('workload') || lower.includes('assignment') || lower.includes('task') || lower.includes('detail') || lower.includes('overview');

        if (isTeamQuery && !asksForAssignmentsOrWorkload) {
          const employees = allUsers.filter(u => u.role === 'EMPLOYEE');
          if (employees.length === 0) {
            return {
              reply: 'The requested information was not found in your workspace database.',
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }

          let reply = `👥 TEAM MEMBERS\n\n`;
          let idx = 1;
          for (const u of employees) {
            reply += `${idx}. ${u.name}\n`;
            reply += `   Role: ${u.specialty || 'Generalist'}\n\n`;
            idx++;
          }
          reply += `Total Team Members: ${employees.length}`;

          return {
            reply: reply,
            intent: 'QUESTION',
            confidenceScore: 0.95,
            extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
          } as unknown as T;
        }

        // --- TEAM / WORKLOAD LISTS ---
        if (lower.includes('workload') || lower.includes('team') || lower.includes('employee overview') || lower.includes('task overview') || lower.includes('assignment')) {
          const employees = allUsers.filter(u => u.role === 'EMPLOYEE');
          if (employees.length === 0) {
            return {
              reply: 'The requested information was not found in your workspace database.',
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }

          let reply = '### EMPLOYEE WORKLOAD OVERVIEW\n\n';
          for (const u of employees) {
            const projectsCount = new Set(u.assignments.map(a => a.task.projectId)).size;
            const active = u.assignments.filter(a => a.task.status === 'IN_PROGRESS').length;
            const queued = u.assignments.filter(a => a.task.status === 'PENDING' || a.task.status === 'PROPOSED').length;
            const completed = u.assignments.filter(a => a.task.status === 'COMPLETED').length;
            const blocked = u.assignments.filter(a => a.task.status === 'BLOCKED').length;
            const load = projectsCount >= 3 ? 95 : projectsCount === 2 ? 80 : projectsCount === 1 ? 60 : 0;

            reply += `* **${u.name}** (${u.specialty || 'Generalist'})\n`;
            reply += `  - Assigned Projects: ${projectsCount}\n`;
            reply += `  - Tasks Breakdown: Active: ${active} | Queued: ${queued} | Completed: ${completed} | Blocked: ${blocked}\n`;
            reply += `  - Workload: ${load}%\n\n`;
          }

          return {
            reply: reply,
            intent: 'QUESTION',
            confidenceScore: 0.95,
            extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
          } as unknown as T;
        }

        // --- TASKS LIST FILTER ---
        if (lower.includes('task') && (lower.includes('completed') || lower.includes('done') || lower.includes('pending') || lower.includes('active') || lower.includes('queued') || lower.includes('overdue') || lower.includes('all') || lower.includes('show') || lower.includes('list'))) {
          let filteredTasks = allTasks;
          let filterHeader = "ALL TASKS";

          if (lower.includes('completed') || lower.includes('done')) {
            filteredTasks = allTasks.filter(t => t.status === 'COMPLETED');
            filterHeader = "COMPLETED TASKS";
          } else if (lower.includes('pending')) {
            filteredTasks = allTasks.filter(t => t.status === 'PENDING' || t.status === 'PROPOSED');
            filterHeader = "PENDING TASKS";
          } else if (lower.includes('active') || lower.includes('in progress') || lower.includes('in-progress')) {
            filteredTasks = allTasks.filter(t => t.status === 'IN_PROGRESS');
            filterHeader = "ACTIVE TASKS";
          } else if (lower.includes('queued')) {
            filteredTasks = allTasks.filter(t => t.status === 'PENDING' || t.status === 'PROPOSED');
            filterHeader = "QUEUED TASKS";
          } else if (lower.includes('overdue')) {
            const now = new Date();
            filteredTasks = allTasks.filter(t => {
              const deadline = t.milestone?.targetDeadline;
              return deadline && new Date(deadline) < now && t.status !== 'COMPLETED';
            });
            filterHeader = "OVERDUE TASKS";
          }

          if (filteredTasks.length === 0) {
            return {
              reply: `The requested information was not found in your workspace database.`,
              intent: 'QUESTION',
              confidenceScore: 0.95,
              extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
            } as unknown as T;
          }

          let reply = `### ${filterHeader}\n\n`;
          for (const t of filteredTasks) {
            const assignName = t.assignments.map(a => a.user.name).join(', ') || 'Unassigned';
            const dueD = t.milestone?.targetDeadline ? new Date(t.milestone.targetDeadline).toLocaleDateString() : 'No due date';
            reply += `* **${t.title}** (Project: *${t.project.name}*)\n`;
            reply += `  - Status: \`${t.status}\` | Assigned to: ${assignName} | Due: ${dueD}\n`;
            if (t.status === 'BLOCKED') {
              reply += `  - Blocker Reason: ${t.description}\n`;
            }
          }

          return {
            reply,
            intent: 'QUESTION',
            confidenceScore: 0.95,
            extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
          } as unknown as T;
        }

      } catch (err) {
        console.error('Error in mock dynamic database chat router:', err);
      } finally {
        await prisma.$disconnect();
      }

      // Default fallback if not found in db
      return {
        reply: 'The requested information was not found in your workspace database.',
        intent: 'QUESTION',
        confidenceScore: 0.9,
        extractedParameters: { blockReason: null, delayReason: null, estimatedCompletionDate: null }
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
