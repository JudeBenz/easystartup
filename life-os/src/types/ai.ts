export type AIProvider = "grok" | "ollama" | "mock";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  createdAt: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface AppContextSnapshot {
  today: string;
  accounts: { id: string; name: string; balance: number; type: string }[];
  recentTransactions: {
    id: string;
    amount: number;
    category: string;
    note: string;
    date: string;
    type: string;
  }[];
  budgetCategories: { name: string; spent: number; limit: number; month: string }[];
  upcomingEvents: {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
  }[];
  projects: {
    id: string;
    name: string;
    status: string;
    taskCount: number;
    doneCount: number;
  }[];
  openTasks: { id: string; projectId: string; title: string; done: boolean; dueDate?: string }[];
}

export interface ChatApiRequest {
  messages: { role: string; content: string; tool_call_id?: string; tool_calls?: ToolCall[] }[];
  context: AppContextSnapshot;
  provider?: AIProvider;
  ollamaModel?: string;
}

export interface ChatApiResponse {
  content: string | null;
  toolCalls: ToolCall[];
  provider: AIProvider;
  model?: string;
}

export interface ToolExecutionResult {
  success: boolean;
  message: string;
  data?: unknown;
}
