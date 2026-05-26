import { useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { FileJson, Copy, Download } from 'lucide-react';

export default function ExportPanel() {
  const { currentProject, entities } = useProjectStore();
  const [mode, setMode] = useState<'cursorrules' | 'prompt'>('cursorrules');
  const [copied, setCopied] = useState(false);

  const cursorRules = `# ${currentProject?.name || 'Novel Studio'} - .cursorrules

## Tech Stack
- Tauri v2 (Rust)
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Zustand (state management)
- SQLite via sqlx (Rust backend)

## Project Structure
\`\`\`
src-tauri/          # Rust backend
  src/
    db.rs           # Database models and operations
    commands.rs     # Tauri commands
    lib.rs          # App entry

src/                # Frontend
  types/            # Shared TypeScript types
  stores/           # Zustand stores
  components/
    ui/             # shadcn/ui components
    layout/         # Sidebar, TopBar
    chat/           # ChatPanel, MessageBubble
    entities/       # EntityList, EntityDetail, etc.
\`\`\`

## Data Models
- Project: id, name, description, timestamps
- Entity: id, project_id, name, type (character/item/location/lore/plot/chapter), content (JSON)
- Relationship: id, project_id, source, target, type, description
- Chapter: id, project_id, title, content, number, timestamps
- Message: id, project_id, role, content, timestamp
- Plan: id, project_id, title, content (Markdown), timestamp

## Patterns
- All DB operations go through commands.rs -> db.rs
- Frontend uses Zustand stores with Tauri invoke wrapper
- Components follow shadcn/ui conventions with cn() utility
- Entity types use discriminated content JSON fields
`;

  const generatePrompt = () => {
    const lines: string[] = [];
    lines.push(`# ${currentProject?.name || 'Novel Studio'} - AI 写作助手 Prompt\n`);
    lines.push('## 项目背景\n');
    lines.push(`${currentProject?.description || '这是一个小说创作项目。'}\n`);
    
    const byType: Record<string, any[]> = {};
    for (const e of entities) {
      (byType[e.entity_type] = byType[e.entity_type] || []).push(e);
    }
    
    for (const [type, items] of Object.entries(byType)) {
      lines.push(`### ${type}`);
      for (const item of items as any[]) {
        lines.push(`- ${item.name}: ${(JSON.parse(item.content || '{}')).description || ''}`);
      }
      lines.push('');
    }
    
    lines.push('## 可用的工具\n');
    lines.push('1. **create_entity** - 创建新的实体（角色/道具/地点等）');
    lines.push('2. **update_entity** - 更新已有实体信息');
    lines.push('3. **create_relationship** - 创建实体间关系');
    lines.push('4. **generate_plan** - 根据项目数据生成开发计划');
    lines.push('\n## 输出格式\n');
    lines.push('请使用 Markdown 格式回复，支持代码块、表格、列表等。\n');
    
    return lines.join('\n');
  };

  const handleCopy = async () => {
    const text = mode === 'cursorrules' ? cursorRules : generatePrompt();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const text = mode === 'cursorrules' ? cursorRules : generatePrompt();
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'cursorrules' ? '.cursorrules' : 'prompt.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const content = mode === 'cursorrules' ? cursorRules : generatePrompt();

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
        <FileJson className="h-4 w-4 text-zinc-500" />
        <span className="text-sm font-medium">导出</span>
        <div className="flex-1" />
        <div className="flex rounded-md border border-zinc-200 dark:border-zinc-600 overflow-hidden">
          <button
            onClick={() => setMode('cursorrules')}
            className={`px-3 py-1 text-xs ${mode === 'cursorrules' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100' : 'bg-white dark:bg-zinc-800 text-zinc-500'}`}
          >
            .cursorrules
          </button>
          <button
            onClick={() => setMode('prompt')}
            className={`px-3 py-1 text-xs ${mode === 'prompt' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100' : 'bg-white dark:bg-zinc-800 text-zinc-500'}`}
          >
            Prompt
          </button>
        </div>
        <Button variant="ghost" size="icon" onClick={handleCopy} title="复制">
          {copied ? <span className="text-xs text-green-500">已复制</span> : <Copy className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDownload} title="下载">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Textarea
          className="min-h-[300px] font-mono text-xs"
          value={content}
          readOnly
        />
      </div>
    </div>
  );
}
