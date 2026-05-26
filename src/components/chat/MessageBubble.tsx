import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';
import { User, Bot, Wrench } from 'lucide-react';
import type { AiToolCall } from '../../types';

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system' | 'tool_call';
  content: string;
  toolCalls?: AiToolCall[];
}

export default function MessageBubble({ role, content, toolCalls }: MessageBubbleProps) {
  const isUser = role === 'user';
  const isTool = role === 'tool_call';

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
          {isTool ? <Wrench className="h-4 w-4 text-zinc-500" /> : <Bot className="h-4 w-4 text-zinc-600" />}
        </div>
      )}

      <div className={cn('max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed', 
        isUser 
          ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900' 
          : isTool
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-zinc-700 dark:text-zinc-300'
            : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
      )}>
        {toolCalls && toolCalls.length > 0 && (
          <div className="mb-2 space-y-1">
            {toolCalls.map((tc, i) => (
              <div key={i} className="text-xs font-mono bg-black/5 dark:bg-white/5 rounded px-2 py-1">
                <span className="font-semibold">{tc.name}</span>
                <pre className="text-xs mt-0.5">{JSON.stringify(tc.arguments, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
        
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-zinc-800 prose-pre:text-zinc-100">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {isUser && (
        <div className="h-8 w-8 rounded-full bg-zinc-300 dark:bg-zinc-600 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
        </div>
      )}
    </div>
  );
}
