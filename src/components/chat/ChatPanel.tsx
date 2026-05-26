import { useEffect, useRef, useState } from 'react';
import { Bot, Eraser, Plus, MessageSquare, Search, X, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useChatStore } from '../../stores/useChatStore';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

export default function ChatPanel() {
  const { currentProject, messages, loadMessages, saveMessage, clearMessages,
    sessions, currentSessionId, loadSessions, createSession, switchSession, deleteSession, searchMessages } = useProjectStore();
  const { chatMessages, isProcessing, sendMessage, clearChat } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (currentProject) {
      loadSessions();
      loadMessages();
    }
  }, [currentProject?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages.length, messages.length]);

  const msgList = messages || [];
  const chatList = chatMessages || [];
  const allMessages = [
    ...msgList.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant' | 'system', content: m.content, toolCalls: undefined, timestamp: m.created_at })),
    ...chatList.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant' | 'system', content: m.content, toolCalls: m.toolCalls, timestamp: m.timestamp })),
  ];

  const handleSend = async (content: string) => {
    if (!currentProject) {
      const proj = await useProjectStore.getState().createProject('默认项目', '');
      await useProjectStore.getState().loadProjectData(proj.id);
    }
    // Auto-create session if none
    if (!currentSessionId) {
      const s = await createSession('新会话');
      if (s) await switchSession(s.id);
    }
    await saveMessage('user', content);
    await sendMessage(content, currentProject?.id || '');
  };

  const handleClearChat = async () => {
    clearChat();
    await clearMessages();
  };

  const handleNewSession = () => {
    createSession('新会话');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const results = await searchMessages(searchQuery);
    setSearchResults(results || []);
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
    <div className="flex-1 flex bg-white dark:bg-zinc-800 min-w-0">
      {/* Session sidebar */}
      <div className="w-48 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex flex-col shrink-0 hidden sm:flex">
        <div className="p-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
          <button onClick={handleNewSession} className="flex-1 flex items-center justify-center gap-1 h-7 rounded bg-zinc-200 dark:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600">
            <Plus className="h-3 w-3" /> 新建
          </button>
          <button onClick={() => setShowSearch(!showSearch)} className="h-7 w-7 rounded flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700">
            <Search className="h-3.5 w-3.5 text-zinc-500" />
          </button>
        </div>

        {showSearch && (
          <div className="p-2 border-b border-zinc-200 dark:border-zinc-700 space-y-1">
            <div className="flex gap-1">
              <input
                className="flex-1 h-7 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none"
                placeholder="搜索消息..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="h-7 px-2 rounded bg-zinc-200 dark:bg-zinc-700 text-xs">搜</button>
            </div>
            {searchResults && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {searchResults.map((r: any) => (
                  <div key={r.id} className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 rounded p-1 truncate">
                    <span className="font-medium">{r.role}:</span> {r.content.slice(0, 60)}
                  </div>
                ))}
                {searchResults.length === 0 && <p className="text-[10px] text-zinc-400 text-center">无结果</p>}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {sessions.map((s: any) => (
            <div
              key={s.id}
              className={`group flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors ${
                currentSessionId === s.id
                  ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              onClick={() => switchSession(s.id)}
            >
              <MessageSquare className="h-3 w-3 shrink-0" />
              <span className="truncate flex-1">{s.title}</span>
              <button
                onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-[10px] text-zinc-400 text-center py-4">暂无会话</p>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="h-10 border-b border-zinc-200 dark:border-zinc-700 flex items-center px-4 gap-2 shrink-0">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">
            {currentProject.name}
          </span>
          <button onClick={handleClearChat} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors" title="清除聊天记录">
            <Eraser className="h-3.5 w-3.5" /> 清除
          </button>
        </div>

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
        <ChatInput onSend={handleSend} disabled={isProcessing} projectId={currentProject?.id} />
      </div>
    </div>
  );
}
