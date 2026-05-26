import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Send, Loader2, Paperclip, X, FileText } from 'lucide-react';
import { api } from '../../stores/useAuthStore';

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  projectId?: string;
}

export default function ChatInput({ onSend, disabled, placeholder = '输入消息...', projectId }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<{ id: string; name: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || disabled) return;
    const msg = input.trim();
    setInput('');
    await onSend(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', projectId);

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setFiles(prev => [...prev, { id: data.id, name: data.name }]);
      }
    } catch {}
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    api(`/files/${id}`, { method: 'DELETE' });
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
      {/* Uploaded files */}
      {files.length > 0 && (
        <div className="px-4 pt-2 flex flex-wrap gap-1.5">
          {files.map(f => (
            <span key={f.id} className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300">
              <FileText className="h-3 w-3" />
              {f.name}
              <button onClick={() => removeFile(f.id)} className="hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="p-4 flex gap-2 items-end">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.json,.yaml,.yml,.csv,.xml,.js,.ts,.py,.go,.rs,.html,.css"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading || !projectId} title="上传文件">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </Button>
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 min-h-[40px] max-h-[200px]"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <Button onClick={handleSend} disabled={disabled || !input.trim()} size="icon">
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
