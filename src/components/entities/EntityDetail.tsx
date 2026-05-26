import { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Save, Trash2, ArrowLeft } from 'lucide-react';
import type { EntityContent } from '../../types';

export default function EntityDetail() {
  const { entities, selectedEntityId, setSelectedEntityId, updateEntity, deleteEntity, loadEntities } = useProjectStore();
  const entity = entities.find(e => e.id === selectedEntityId);
  const [name, setName] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (entity) {
      setName(entity.name);
      try { setFields(JSON.parse(entity.content)); } catch { setFields({}); }
    }
  }, [entity?.id]);

  const handleSave = async () => {
    if (!entity) return;
    await updateEntity(entity.id, name, entity.entity_type, JSON.stringify(fields));
    await loadEntities();
  };

  const handleDelete = async () => {
    if (!entity) return;
    await deleteEntity(entity.id);
    setSelectedEntityId(null);
    await loadEntities();
  };

  if (!entity) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-zinc-400">选择一个实体查看详情</p>
      </div>
    );
  }

  const entityFields: { key: string; label: string }[] = (() => {
    switch (entity.entity_type) {
      case 'character': return [
        { key: 'age', label: '年龄' }, { key: 'gender', label: '性别' },
        { key: 'appearance', label: '外貌' }, { key: 'personality', label: '性格' },
        { key: 'background', label: '背景故事' }, { key: 'abilities', label: '能力' },
      ];
      case 'item': return [
        { key: 'description', label: '描述' }, { key: 'properties', label: '属性' },
      ];
      case 'location': return [
        { key: 'description', label: '描述' }, { key: 'inhabitants', label: '居民' },
        { key: 'significance', label: '重要性' },
      ];
      case 'lore': return [
        { key: 'summary', label: '概要' }, { key: 'details', label: '详细设定' },
      ];
      case 'plot': return [
        { key: 'summary', label: '概要' }, { key: 'arc', label: '故事弧' },
        { key: 'status', label: '状态' },
      ];
      default: return [{ key: 'description', label: '描述' }];
    }
  })();

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setSelectedEntityId(null)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium truncate">{entity.name}</span>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={handleSave} title="保存">
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDelete} title="删除" className="text-red-500 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div>
          <label className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">名称</label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        {entityFields.map(({ key, label }) => (
          <div key={key}>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">{label}</label>
            <Textarea
              value={fields[key] || ''}
              onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
              rows={3}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
