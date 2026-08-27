import type { ToolDefinition } from "@/types/ai";

export const LIFE_OS_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "add_calendar_event",
      description:
        "Add an event to the calendar. Use ISO 8601 dates. For all-day events set allDay true.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title" },
          start: {
            type: "string",
            description: "Start datetime ISO 8601, e.g. 2026-08-27T14:00:00",
          },
          end: {
            type: "string",
            description: "End datetime ISO 8601",
          },
          allDay: { type: "boolean", description: "All-day event" },
          color: { type: "string", description: "Hex color, optional" },
        },
        required: ["title", "start", "end"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_calendar_event",
      description: "Delete a calendar event by id or by matching title",
      parameters: {
        type: "object",
        properties: {
          eventId: { type: "string", description: "Event id if known" },
          title: { type: "string", description: "Match event by title" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_calendar_events",
      description: "List calendar events, optionally filtered by date range",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Start date YYYY-MM-DD" },
          to: { type: "string", description: "End date YYYY-MM-DD" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_transaction",
      description: "Log income or expense to an account and update budget",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Positive dollar amount" },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string", description: "Budget category name" },
          note: { type: "string", description: "Description" },
          accountName: {
            type: "string",
            description: "Account name, defaults to Checking",
          },
          date: { type: "string", description: "YYYY-MM-DD, defaults to today" },
        },
        required: ["amount", "type", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_summary",
      description: "Get total balance, accounts, and budget status",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "add_project",
      description: "Create a new project",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          status: {
            type: "string",
            enum: ["planning", "active", "paused", "done"],
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Add a task to a project",
      parameters: {
        type: "object",
        properties: {
          projectName: { type: "string", description: "Project name" },
          projectId: { type: "string", description: "Project id if known" },
          title: { type: "string" },
          dueDate: { type: "string", description: "YYYY-MM-DD optional" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Mark a task as done by id or title",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          title: { type: "string", description: "Match task by title" },
          projectName: { type: "string", description: "Disambiguate by project" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_project_status",
      description: "Change a project's status",
      parameters: {
        type: "object",
        properties: {
          projectName: { type: "string" },
          projectId: { type: "string" },
          status: {
            type: "string",
            enum: ["planning", "active", "paused", "done"],
          },
        },
        required: ["status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_app",
      description:
        "Open a Life OS app: maze-bank, calendar, errands, dynasty-projects, lifeinvader, settings",
      parameters: {
        type: "object",
        properties: {
          appId: {
            type: "string",
            enum: [
              "maze-bank",
              "calendar",
              "errands",
              "dynasty-projects",
              "lifeinvader",
              "settings",
            ],
          },
        },
        required: ["appId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_errand",
      description: "Add a recurring daily/few-day checklist item (errand/habit)",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          frequency: {
            type: "string",
            enum: ["daily", "every_2_days", "every_3_days", "weekly"],
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_errand",
      description: "Mark an errand done for today by title",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
];

export const SYSTEM_PROMPT = `You are LifeInvader AI, the voice assistant for Life OS — a personal life tracker styled like GTA V's in-game computer.

You can control the user's calendar, budget, and projects by calling tools. Always:
- Use the provided app context to resolve ids and names
- Confirm what you did in plain, friendly language (brief, not robotic)
- Ask for clarification if a request is ambiguous
- Prefer tool calls over telling the user to do things manually
- Use ISO dates; today's date is in the context
- For expenses use add_transaction with type "expense"; for income use type "income"

When the user says things like "add dentist Thursday at 2pm" or "log $50 groceries", execute the appropriate tools immediately.`;
