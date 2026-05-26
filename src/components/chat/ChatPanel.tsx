import { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useChatStore } from '../../stores/useChatStore';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

export default function ChatPanel() {
  const { currentProject, messages, loadMessages, saveMessage } = useProjectStore();
  const { chatMessages, isProcessing, sendMessage } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentProject) {
      loadMessages();
    }
  }, [currentProject?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages.length]);

  // Combine DB messages with chat messages
  const msgList = messages || [];
  const chatList = chatMessages || [];
  const allMessages = [
    ...msgList.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant' | 'system', content: m.content, toolCalls: undefined, timestamp: m.created_at })),
    ...chatList.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant' | 'system', content: m.content, toolCalls: m.toolCalls, timestamp: m.timestamp })),
  ];

  const handleSend = async (content: string) => {
    if (!currentProject) {
      // Auto-create a default project if none selected
      const proj = await useProjectStore.getState().createProject('默认项目', '');
      await useProjectStore.getState().loadProjectData(proj.id);
    }
    await saveMessage('user', content);
    await sendMessage(content);
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-zinc-800">
        <div className="text-center space-y-3">
          <h2 className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">欢迎使用 Tarui Novel Studio</h2>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">在顶部栏创建一个项目开始写作</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-800 min-w-0">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-2">
        {allMessages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">开始对话，AI 助手将帮助你管理小说元素</p>
          </div>
        )}
        {allMessages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble role={msg.role} content={msg.content} toolCalls={msg.toolCalls} />
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-3 px-4 py-3">
            <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
              <Bot className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-700 rounded-lg px-4 py-2.5">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 animate-pulse">思考中...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isProcessing} />
    </div>
  );
}
