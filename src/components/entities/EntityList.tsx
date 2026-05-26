import { useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogHeader, DialogTitle } from '../ui/dialog';
import { Plus, Search } from 'lucide-react';
import type { EntityType, NavSection } from '../../types';

const typeLabelMap: Record<string, string> = {
  character: '角色',
  item: '道具',
  location: '地点',
  lore: '设定',
  plot: '剧情',
  chapter: '章节',
};

const navToEntityType: Partial<Record<NavSection, EntityType>> = {
  characters: 'character',
  items: 'item',
  locations: 'location',
  lore: 'lore',
  plots: 'plot',
  chapters: 'chapter',
};

export default function EntityList() {
  const { entities, activeNav, selectedEntityId, setSelectedEntityId, createEntity, loadEntities } = useProjectStore();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const entityType = navToEntityType[activeNav];
  const list = entities || [];
  const filtered = list
    .filter(e => entityType ? e.entity_type === entityType : true)
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!newName.trim() || !entityType) return;
    await createEntity(newName.trim(), entityType);
    setShowNew(false);
    setNewName('');
    await loadEntities();
  };

  if (!entityType && activeNav !== 'relationships' && activeNav !== 'plan') return null;

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              className="w-full h-8 rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 pl-7 pr-2 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              placeholder="搜索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowNew(true)} title={`新建${typeLabelMap[entityType || ''] || '实体'}`}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map(entity => (
          <button
            key={entity.id}
            onClick={() => setSelectedEntityId(entity.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              selectedEntityId === entity.id
                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <div className="font-medium truncate">{entity.name}</div>
            <Badge variant="secondary" className="mt-0.5 text-[10px]">{typeLabelMap[entity.entity_type] || entity.entity_type}</Badge>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-zinc-400 text-center py-4">
            {search ? '没有匹配的结果' : `暂无${typeLabelMap[entityType || ''] || '实体'}，点击 + 新建`}
          </p>
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogHeader><DialogTitle>新建{typeLabelMap[entityType || ''] || '实体'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="名称" value={newName} onChange={e => setNewName(e.target.value)} />
          <Button onClick={handleCreate} className="w-full">创建</Button>
        </div>
      </Dialog>
    </div>
  );
}
