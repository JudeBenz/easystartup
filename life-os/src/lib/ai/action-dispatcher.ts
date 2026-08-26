import { useLifeStore } from "@/lib/store";
import type { ToolExecutionResult } from "@/types/ai";

const COLORS = ["#3498db", "#e74c3c", "#2ecc71", "#9b59b6", "#f39c12"];

export function executeTool(
  name: string,
  args: Record<string, unknown>,
): ToolExecutionResult {
  const store = useLifeStore.getState();

  try {
    switch (name) {
      case "add_calendar_event":
        return addCalendarEvent(args);
      case "delete_calendar_event":
        return deleteCalendarEvent(args);
      case "list_calendar_events":
        return listCalendarEvents(args);
      case "add_transaction":
        return addTransaction(args);
      case "get_financial_summary":
        return getFinancialSummary();
      case "add_project":
        return addProject(args);
      case "add_task":
        return addTask(args);
      case "complete_task":
        return completeTask(args);
      case "update_project_status":
        return updateProjectStatus(args);
      case "open_app":
        return openApp(args);
      default:
        return { success: false, message: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Tool execution failed",
    };
  }

  function addCalendarEvent(args: Record<string, unknown>): ToolExecutionResult {
    const title = String(args.title ?? "").trim();
    const start = String(args.start ?? "");
    const end = String(args.end ?? start);
    if (!title || !start) {
      return { success: false, message: "title and start are required" };
    }
    const allDay = Boolean(args.allDay);
    const color =
      typeof args.color === "string"
        ? args.color
        : COLORS[Math.floor(Math.random() * COLORS.length)];

    store.addEvent({ title, start, end, allDay, color });
    store.openModule("calendar");
    return {
      success: true,
      message: `Added calendar event "${title}"`,
      data: { title, start, end },
    };
  }

  function deleteCalendarEvent(args: Record<string, unknown>): ToolExecutionResult {
    const eventId = args.eventId ? String(args.eventId) : undefined;
    const title = args.title ? String(args.title).toLowerCase() : undefined;

    let target = eventId
      ? store.events.find((e) => e.id === eventId)
      : undefined;
    if (!target && title) {
      target = store.events.find((e) => e.title.toLowerCase().includes(title));
    }
    if (!target) {
      return { success: false, message: "Event not found" };
    }
    store.deleteEvent(target.id);
    return {
      success: true,
      message: `Deleted event "${target.title}"`,
    };
  }

  function listCalendarEvents(args: Record<string, unknown>): ToolExecutionResult {
    const from = args.from ? String(args.from) : undefined;
    const to = args.to ? String(args.to) : undefined;
    let events = [...store.events];
    if (from) events = events.filter((e) => e.start.slice(0, 10) >= from);
    if (to) events = events.filter((e) => e.start.slice(0, 10) <= to);
    events.sort((a, b) => a.start.localeCompare(b.start));
    return {
      success: true,
      message: `Found ${events.length} events`,
      data: events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
      })),
    };
  }

  function addTransaction(args: Record<string, unknown>): ToolExecutionResult {
    const amount = Number(args.amount);
    const type = args.type === "income" ? "income" : "expense";
    const category = String(args.category ?? "Other");
    const note = String(args.note ?? category);
    const date = String(args.date ?? new Date().toISOString().slice(0, 10));
    const accountName = String(args.accountName ?? "Checking");

    if (!amount || amount <= 0) {
      return { success: false, message: "amount must be a positive number" };
    }

    const account =
      store.accounts.find(
        (a) => a.name.toLowerCase() === accountName.toLowerCase(),
      ) ?? store.accounts[0];

    if (!account) {
      return { success: false, message: "No account found" };
    }

    store.addTransaction({
      accountId: account.id,
      amount,
      category,
      note,
      date,
      type,
    });
    store.openModule("maze-bank");

    return {
      success: true,
      message: `Logged ${type} of $${amount.toFixed(2)} for ${category}`,
      data: { amount, type, category, account: account.name },
    };
  }

  function getFinancialSummary(): ToolExecutionResult {
    const total = store.accounts.reduce((s, a) => s + a.balance, 0);
    return {
      success: true,
      message: "Financial summary",
      data: {
        totalBalance: total,
        accounts: store.accounts.map((a) => ({
          name: a.name,
          balance: a.balance,
        })),
        budget: store.budgetCategories.map((c) => ({
          name: c.name,
          spent: c.spent,
          limit: c.limit,
          remaining: c.limit - c.spent,
        })),
      },
    };
  }

  function addProject(args: Record<string, unknown>): ToolExecutionResult {
    const name = String(args.name ?? "").trim();
    if (!name) return { success: false, message: "name is required" };

    const status =
      (args.status as "planning" | "active" | "paused" | "done") ?? "planning";
    const description = String(args.description ?? "");

    store.addProject({
      name,
      description,
      status,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
    store.openModule("dynasty-projects");

    return { success: true, message: `Created project "${name}"` };
  }

  function addTask(args: Record<string, unknown>): ToolExecutionResult {
    const title = String(args.title ?? "").trim();
    if (!title) return { success: false, message: "title is required" };

    let projectId = args.projectId ? String(args.projectId) : undefined;
    if (!projectId && args.projectName) {
      const pname = String(args.projectName).toLowerCase();
      projectId = store.projects.find((p) =>
        p.name.toLowerCase().includes(pname),
      )?.id;
    }
    if (!projectId) {
      projectId = store.projects.find((p) => p.status === "active")?.id;
    }
    if (!projectId) {
      return { success: false, message: "No project found to add task to" };
    }

    const priority =
      (args.priority as "low" | "medium" | "high") ?? "medium";
    const dueDate = args.dueDate ? String(args.dueDate) : undefined;
    const order = store.tasks.filter((t) => t.projectId === projectId).length;

    store.addTask({
      projectId,
      title,
      done: false,
      priority,
      dueDate,
      order,
    });
    store.openModule("dynasty-projects");

    return { success: true, message: `Added task "${title}"` };
  }

  function completeTask(args: Record<string, unknown>): ToolExecutionResult {
    let task = args.taskId
      ? store.tasks.find((t) => t.id === String(args.taskId))
      : undefined;

    if (!task && args.title) {
      const title = String(args.title).toLowerCase();
      const candidates = store.tasks.filter((t) =>
        t.title.toLowerCase().includes(title),
      );
      if (args.projectName) {
        const pname = String(args.projectName).toLowerCase();
        const proj = store.projects.find((p) =>
          p.name.toLowerCase().includes(pname),
        );
        task = candidates.find((t) => t.projectId === proj?.id);
      } else {
        task = candidates[0];
      }
    }

    if (!task) return { success: false, message: "Task not found" };
    if (!task.done) store.toggleTask(task.id);

    return { success: true, message: `Completed task "${task.title}"` };
  }

  function updateProjectStatus(
    args: Record<string, unknown>,
  ): ToolExecutionResult {
    const status = args.status as "planning" | "active" | "paused" | "done";
    if (!status) return { success: false, message: "status is required" };

    let project = args.projectId
      ? store.projects.find((p) => p.id === String(args.projectId))
      : undefined;
    if (!project && args.projectName) {
      const pname = String(args.projectName).toLowerCase();
      project = store.projects.find((p) =>
        p.name.toLowerCase().includes(pname),
      );
    }
    if (!project) return { success: false, message: "Project not found" };

    store.updateProjectStatus(project.id, status);
    return {
      success: true,
      message: `Updated "${project.name}" to ${status}`,
    };
  }

  function openApp(args: Record<string, unknown>): ToolExecutionResult {
    const appId = String(args.appId ?? "");
    const valid = [
      "maze-bank",
      "calendar",
      "dynasty-projects",
      "lifeinvader",
      "settings",
    ];
    if (!valid.includes(appId)) {
      return { success: false, message: `Invalid appId: ${appId}` };
    }
    store.openModule(appId);
    return { success: true, message: `Opened ${appId}` };
  }
}
