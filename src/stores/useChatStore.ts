import { create } from 'zustand';
import type { ChatSettings, AiToolCall } from '../types';

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
  
  setSettings: (settings: Partial<ChatSettings>) => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setProcessing: (v: boolean) => void;
  clearChat: () => void;
  
  // Mock AI response (will be replaced with real API later)
  sendMessage: (content: string) => Promise<void>;
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
  
  setSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
  
  addMessage: (msg) => set((s) => ({
    chatMessages: [...s.chatMessages, { ...msg, id: crypto.randomUUID(), timestamp: new Date().toISOString() }]
  })),
  
  setProcessing: (v) => set({ isProcessing: v }),
  
  clearChat: () => set({ chatMessages: [] }),
  
  sendMessage: async (content) => {
    const { addMessage, settings } = get();
    
    // Add user message
    addMessage({ role: 'user', content });
    set({ isProcessing: true });
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1000));
    
    // Mock AI tool calling logic
    const toolCalls: AiToolCall[] = [];
    
    // Detect if user wants to create an entity
    if (content.includes('创建') || content.includes('新建')) {
      if (content.includes('角色') || content.includes('人物')) {
        toolCalls.push({ name: 'create_entity', arguments: { name: extractName(content, '角色'), entity_type: 'character', content: JSON.stringify({ personality: extractDescription(content) }) } });
      } else if (content.includes('道具') || content.includes('物品')) {
        toolCalls.push({ name: 'create_entity', arguments: { name: extractName(content, '道具'), entity_type: 'item', content: JSON.stringify({ description: extractDescription(content) }) } });
      } else if (content.includes('地点') || content.includes('场景')) {
        toolCalls.push({ name: 'create_entity', arguments: { name: extractName(content, '地点'), entity_type: 'location', content: JSON.stringify({ description: extractDescription(content) }) } });
      }
    }
    
    // Detect relationship creation
    if (content.includes('关系') || content.includes('关联')) {
      toolCalls.push({ name: 'create_relationship', arguments: { source_entity_id: 'mock-source', target_entity_id: 'mock-target', relationship_type: 'friend', description: extractDescription(content) } });
    }
    
    // Generate plan
    if (content.includes('计划') || content.includes('方案') || content.includes('生成')) {
      toolCalls.push({ name: 'generate_plan', arguments: { title: extractName(content, '计划'), content: content } });
    }
    
    if (toolCalls.length > 0) {
      // Show tool calls
      for (const tc of toolCalls) {
        addMessage({ role: 'tool_call', content: `调用工具: ${tc.name}`, toolCalls: [tc] });
      }
      
      // Generate mock AI response based on tool results
      const response = generateMockResponse(content, toolCalls);
      addMessage({ role: 'assistant', content: response });
    } else {
      // General chat response
      addMessage({ role: 'assistant', content: generateChatResponse(content) });
    }
    
    set({ isProcessing: false });
  },
}));

function extractName(text: string, fallbackType: string): string {
  const patterns = [
    /(?:叫|名为|叫做|名称|名字)[：:]?\s*([^\s，。！？、,.;!?]{1,20})/,
    /([^\s，。！？、,.;!?]{1,20})(?:角色|人物|道具|物品|地点|计划)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return `新${fallbackType}`;
}

function extractDescription(text: string): string {
  const patterns = [
    /(?:描述|介绍|说明|特征)[：:]?\s*([^。！？\n]{1,100})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return text.slice(0, 80);
}

function generateMockResponse(content: string, toolCalls: AiToolCall[]): string {
  const results = toolCalls.map(tc => {
    switch (tc.name) {
      case 'create_entity':
        return `已创建实体「${tc.arguments.name}」(${tc.arguments.entity_type})`;
      case 'create_relationship':
        return `已建立关系: ${tc.arguments.source_entity_id} → ${tc.arguments.target_entity_id} (${tc.arguments.relationship_type})`;
      case 'generate_plan':
        return `已生成计划「${tc.arguments.title}」`;
      default:
        return `已执行 ${tc.name}`;
    }
  });
  return `已完成以下操作：\n\n${results.map(r => `- ${r}`).join('\n')}\n\n还有什么需要帮忙的吗？`;
}

function generateChatResponse(content: string): string {
  if (content.includes('你好') || content.includes('嗨')) {
    return '你好！我是你的AI写作助手。我可以帮你管理小说项目中的角色、道具、地点等元素，也可以协助你制定写作计划。请告诉我你的需求！';
  }
  if (content.includes('帮助') || content.includes('功能')) {
    return '我可以帮你：\n\n1. **管理项目** - 创建和管理小说项目\n2. **创建实体** - 添加角色、道具、地点等\n3. **建立关系** - 定义实体之间的关系\n4. **生成计划** - 根据项目数据生成开发计划\n5. **导出** - 导出 .cursorrules 和 Prompt 文件\n\n试试说"创建一个叫张伟的角色"或"帮我生成开发计划"！';
  }
  return `收到你的消息。我理解你提到了关于「${content.slice(0, 30)}」的内容。作为AI写作助手，我可以帮你管理小说元素、生成创作计划等。需要我具体做什么吗？`;
}
