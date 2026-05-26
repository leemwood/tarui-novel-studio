import { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogHeader, DialogTitle } from '../ui/dialog';
import { Plus, ArrowRight } from 'lucide-react';

export default function RelationshipGraph() {
  const { relationships, entities, loadRelationships, createRelationship, loadEntities } = useProjectStore();
  const [showNew, setShowNew] = useState(false);
  const [srcId, setSrcId] = useState('');
  const [tgtId, setTgtId] = useState('');
  const [relType, setRelType] = useState('');
  const [relDesc, setRelDesc] = useState('');

  useEffect(() => { loadRelationships(); loadEntities(); }, []);

  const handleCreate = async () => {
    if (!srcId || !tgtId) return;
    await createRelationship(srcId, tgtId, relType, relDesc);
    setShowNew(false);
    setSrcId('');
    setTgtId('');
    setRelType('');
    setRelDesc('');
    await loadRelationships();
  };

  const entityName = (id: string) => entities.find(e => e.id === id)?.name || id.slice(0, 8);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
        <span className="text-sm font-medium">关系图谱</span>
        <Button variant="ghost" size="icon" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {relationships.length === 0 && (
          <p className="text-sm text-zinc-400 text-center py-8">暂无关系，点击 + 添加</p>
        )}
        {relationships.map(rel => (
          <div key={rel.id} className="flex items-center gap-2 p-2 rounded-md bg-zinc-50 dark:bg-zinc-800 text-sm">
            <span className="font-medium truncate">{entityName(rel.source_entity_id)}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-zinc-400" />
            <span className="font-medium truncate">{entityName(rel.target_entity_id)}</span>
            {rel.relationship_type && (
              <span className="text-xs text-zinc-400 ml-auto shrink-0">({rel.relationship_type})</span>
            )}
          </div>
        ))}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogHeader><DialogTitle>新建关系</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">源实体</label>
            <select className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 text-sm"
              value={srcId} onChange={e => setSrcId(e.target.value)}>
              <option value="">选择...</option>
              {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">目标实体</label>
            <select className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 text-sm"
              value={tgtId} onChange={e => setTgtId(e.target.value)}>
              <option value="">选择...</option>
              {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <Input placeholder="关系类型（如：朋友、宿敌）" value={relType} onChange={e => setRelType(e.target.value)} />
          <Input placeholder="描述（可选）" value={relDesc} onChange={e => setRelDesc(e.target.value)} />
          <Button onClick={handleCreate} className="w-full">创建</Button>
        </div>
      </Dialog>
    </div>
  );
}
