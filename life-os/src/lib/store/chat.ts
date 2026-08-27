import type { AIProvider, ChatMessage } from "@/types/ai";

export interface ChatSlice {
  chatMessages: ChatMessage[];
  aiProvider: AIProvider | "auto";
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  setAiProvider: (provider: AIProvider | "auto") => void;
}

export const createChatSlice = (
  set: (fn: (state: ChatSlice) => Partial<ChatSlice>) => void,
): ChatSlice => ({
  chatMessages: [],
  aiProvider: "auto",

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, msg],
    })),

  clearChat: () => set(() => ({ chatMessages: [] })),

  setAiProvider: (provider) => set(() => ({ aiProvider: provider })),
});
