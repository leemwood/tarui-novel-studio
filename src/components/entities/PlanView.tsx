import { useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Download, Plus } from 'lucide-react';

export default function PlanView() {
  const { plans, entities, relationships, currentProject, savePlan } = useProjectStore();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    if (!currentProject) return;
    const planContent = generatePlanMarkdown(currentProject, entities, relationships);
    await savePlan(`开发计划 - ${new Date().toLocaleDateString()}`, planContent);
    window.location.reload(); // quick refresh - in production use store reload
  };

  const selected = plans.find(p => p.id === selectedPlan);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
        <FileText className="h-4 w-4 text-zinc-500" />
        <span className="text-sm font-medium">开发计划</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleGeneratePlan}>
          <Plus className="h-3.5 w-3.5 mr-1" /> 生成计划
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Plan list */}
        <div className="w-48 border-r border-zinc-200 dark:border-zinc-700 overflow-y-auto p-2 space-y-1">
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                selectedPlan === p.id
                  ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <div className="font-medium truncate">{p.title}</div>
              <div className="text-[10px] text-zinc-400">{p.created_at?.slice(0, 10)}</div>
            </button>
          ))}
          {plans.length === 0 && (
            <p className="text-xs text-zinc-400 text-center py-4">暂无计划</p>
          )}
        </div>

        {/* Plan content */}
        <div className="flex-1 overflow-y-auto p-4">
          {selected ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-8">选择或生成一个计划</p>
          )}
        </div>
      </div>
    </div>
  );
}

function generatePlanMarkdown(project: { name: string; description: string }, entities: any[], relationships: any[]): string {
  const lines: string[] = [];

  lines.push(`# ${project.name} - 开发计划\n`);
  lines.push(`> ${project.description || '小说项目开发计划'}\n`);
  
  lines.push('## 数据结构概览\n');
  lines.push('| 模型 | 说明 |');
  lines.push('|------|------|');
  lines.push('| Project | 项目信息，包含名称和描述 |');
  lines.push('| Entity | 实体（角色/道具/地点/设定/剧情/章节），包含类型和自定义字段 |');
  lines.push('| Relationship | 实体间关系，支持双向关联和类型标签 |');
  lines.push('| Chapter | 章节内容，按编号排序 |');
  lines.push('| Message | 聊天记录，支持角色区分 |');
  lines.push('| Plan | 开发计划，Markdown 格式存储 |');
  lines.push('');

  const byType: Record<string, any[]> = {};
  for (const e of entities) {
    (byType[e.entity_type] = byType[e.entity_type] || []).push(e);
  }

  for (const [type, items] of Object.entries(byType)) {
    lines.push(`### ${type} (${items.length})\n`);
    for (const item of items as any[]) {
      lines.push(`- **${item.name}** — ${(JSON.parse(item.content || '{}')).description || '无描述'}`);
    }
    lines.push('');
  }

  if (relationships.length > 0) {
    lines.push('## 关系网络\n');
    lines.push('```');
    for (const rel of relationships) {
      const src = entities.find(e => e.id === rel.source_entity_id)?.name || rel.source_entity_id;
      const tgt = entities.find(e => e.id === rel.target_entity_id)?.name || rel.target_entity_id;
      lines.push(`${src} —${rel.relationship_type || '关联'}→ ${tgt}`);
    }
    lines.push('```\n');
  }

  lines.push('## 实现步骤\n');
  lines.push('1. **项目初始化** - 搭建 Tauri v2 + React + TypeScript 项目结构');
  lines.push('2. **数据库设计** - SQLite 表结构创建和迁移');
  lines.push('3. **UI 框架** - Tailwind CSS + shadcn/ui 组件库搭建');
  lines.push('4. **状态管理** - Zustand 状态层，对接 Tauri invoke');
  lines.push('5. **AI 集成** - 支持 OpenAI/Claude API 的聊天界面和工具调用');
  lines.push('6. **导出功能** - 生成 .cursorrules 和 Prompt 文件');

  return lines.join('\n');
}
