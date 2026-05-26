import { create } from 'zustand';
import { api } from './useAuthStore';
import type { AiToolCall, ChatSettings } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool_call';
  content: string;
  toolCalls?: AiToolCall[];
  timestamp: string;
}

interface ChatStore {
  settings: ChatSettings;
  chatMessages: ChatMessage[];
  isProcessing: boolean;

  loadSettings: () => Promise<void>;
  saveSettings: (s: Partial<ChatSettings>) => Promise<void>;
  setSettings: (s: Partial<ChatSettings>) => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setProcessing: (v: boolean) => void;
  clearChat: () => void;
  sendMessage: (content: string, projectId: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  settings: {
    apiProvider: 'openai',
    apiKey: '',
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1',
  },
  chatMessages: [],
  isProcessing: false,

  loadSettings: async () => {
    try {
      const res = await api('/settings');
      if (!res.ok) return;
      const data = await res.json();
      set({
        settings: {
          apiProvider: data.api_provider || 'openai',
          apiKey: '',
          model: data.api_model || 'gpt-4o',
          baseUrl: data.api_base_url || 'https://api.openai.com/v1',
        },
      });
    } catch {}
  },

  saveSettings: async (partial) => {
    const current = get().settings;
    const merged = { ...current, ...partial };
    try {
      await api('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          api_provider: merged.apiProvider,
          api_key: merged.apiKey,
          api_model: merged.model,
          api_base_url: merged.baseUrl,
        }),
      });
      set({ settings: merged });
    } catch {}
  },

  setSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),

  addMessage: (msg) => set((s) => ({
    chatMessages: [...s.chatMessages, { ...msg, id: crypto.randomUUID(), timestamp: new Date().toISOString() }],
  })),

  setProcessing: (v) => set({ isProcessing: v }),

  clearChat: () => set({ chatMessages: [] }),

  sendMessage: async (content, projectId) => {
    const { addMessage, chatMessages } = get();

    addMessage({ role: 'user', content });
    set({ isProcessing: true });

    // Build history
    const history = chatMessages.map(m => ({
      role: m.role === 'tool_call' ? 'assistant' : m.role,
      content: m.content,
    }));

    try {
      const res = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          message: content,
          history,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '请求失败' }));
        addMessage({ role: 'assistant', content: `错误: ${err.error || res.statusText}` });
        set({ isProcessing: false });
        return;
      }

      const result = await res.json();
      addMessage({ role: 'assistant', content: result.content || '完成。' });
    } catch (e: any) {
      addMessage({ role: 'assistant', content: `连接失败: ${e.message}` });
    }

    set({ isProcessing: false });
  },
}));
