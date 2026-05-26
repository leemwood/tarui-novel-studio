import { useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogHeader, DialogTitle } from '../ui/dialog';
import { Plus, Settings, Download, LogOut } from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';

export default function TopBar() {
  const { projects, currentProject, setCurrentProject, createProject, loadProjects, loadProjectData } = useProjectStore();
  const { settings, setSettings } = useChatStore();
  const [showNewProj, setShowNewProj] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const proj = await createProject(newName.trim(), newDesc.trim());
    setShowNewProj(false);
    setNewName('');
    setNewDesc('');
    await loadProjectData(proj.id);
  };

  const handleProjectSwitch = async (id: string) => {
    const proj = projects.find(p => p.id === id);
    if (proj) {
      setCurrentProject(proj);
      await loadProjectData(proj.id);
    }
  };

  return (
    <>
      <header className="h-12 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center px-4 gap-3 shrink-0">
        {/* Project selector */}
        <div className="flex items-center gap-2">
          <select
            className="h-8 rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 text-sm text-zinc-800 dark:text-zinc-100"
            value={currentProject?.id || ''}
            onChange={(e) => e.target.value && handleProjectSwitch(e.target.value)}
          >
            <option value="">选择项目...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <Button variant="ghost" size="icon" onClick={() => setShowNewProj(true)} title="新建项目">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1" />

        {/* Right actions */}
        <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
          <Settings className="h-4 w-4 mr-1" /> API设置
        </Button>
        <Button variant="ghost" size="icon" title="导出" onClick={() => useProjectStore.getState().setActiveNav('plan')}>
          <Download className="h-4 w-4" />
        </Button>
      </header>

      {/* New Project Dialog */}
      <Dialog open={showNewProj} onOpenChange={setShowNewProj}>
        <DialogHeader><DialogTitle>新建项目</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="项目名称" value={newName} onChange={e => setNewName(e.target.value)} />
          <Input placeholder="项目描述（可选）" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          <Button onClick={handleCreate} className="w-full">创建</Button>
        </div>
      </Dialog>

      {/* API Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogHeader><DialogTitle>API 设置</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400">API 提供商</label>
            <select
              className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 text-sm"
              value={settings.apiProvider}
              onChange={e => setSettings({ apiProvider: e.target.value as 'openai' | 'claude' })}
            >
              <option value="openai">OpenAI</option>
              <option value="claude">Claude</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400">API Key</label>
            <Input type="password" placeholder="sk-..." value={settings.apiKey} onChange={e => setSettings({ apiKey: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400">模型</label>
            <Input value={settings.model} onChange={e => setSettings({ model: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400">API Base URL</label>
            <Input value={settings.baseUrl} onChange={e => setSettings({ baseUrl: e.target.value })} />
          </div>
        </div>
      </Dialog>
    </>
  );
}
