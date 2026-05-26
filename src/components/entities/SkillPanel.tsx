import { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { api } from '../../stores/useAuthStore';
import { Zap, Search, Play, Download, Loader2, ExternalLink } from 'lucide-react';

interface Skill {
  name: string;
  slug: string;
  version: string;
  description: string;
}

export default function SkillPanel() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [installSlug, setInstallSlug] = useState('');
  const [installing, setInstalling] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [runOutput, setRunOutput] = useState<string | null>(null);
  const [runSkill, setRunSkill] = useState<string | null>(null);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const res = await api('/skills');
      if (res.ok) setSkills(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadSkills(); }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchResult('');
    try {
      const res = await api(`/skills/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data.output || '无结果');
      }
    } catch {}
  };

  const handleInstall = async () => {
    if (!installSlug.trim()) return;
    setInstalling(true);
    try {
      await api('/skills/install', {
        method: 'POST',
        body: JSON.stringify({ slug: installSlug.trim() }),
      });
      setInstallSlug('');
      await loadSkills();
    } catch {}
    setInstalling(false);
  };

  const handleRun = async (slug: string) => {
    setRunning(slug);
    setRunSkill(slug);
    setRunOutput(null);
    try {
      const res = await api('/skills/run', {
        method: 'POST',
        body: JSON.stringify({ slug, input: '运行此技能' }),
      });
      if (res.ok) {
        const data = await res.json();
        setRunOutput(data.output || '无输出');
      } else {
        setRunOutput('运行失败');
      }
    } catch {
      setRunOutput('请求失败');
    }
    setRunning(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-medium">技能管理</span>
        </div>

        {/* Install */}
        <div className="flex gap-1">
          <Input
            placeholder="输入 skill slug 安装..."
            value={installSlug}
            onChange={e => setInstallSlug(e.target.value)}
            className="flex-1 h-8 text-xs"
          />
          <Button variant="outline" size="sm" onClick={handleInstall} disabled={installing}>
            {installing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            安装
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-1">
          <Input
            placeholder="搜索技能..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 h-8 text-xs"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="outline" size="sm" onClick={handleSearch}>
            <Search className="h-3 w-3" />
          </Button>
        </div>
        {searchResult && (
          <pre className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded p-2 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {searchResult}
          </pre>
        )}
      </div>

      {/* Installed skills */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          </div>
        ) : skills.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-8">暂无已安装的技能</p>
        ) : (
          skills.map(skill => (
            <div key={skill.slug} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate flex-1">{skill.name}</span>
                <Badge variant="secondary" className="text-[10px]">{skill.version}</Badge>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{skill.description}</p>
              <div className="flex gap-1 pt-1">
                <Button variant="ghost" size="sm" onClick={() => handleRun(skill.slug)} disabled={running === skill.slug}>
                  {running === skill.slug ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  运行
                </Button>
              </div>
              {runOutput && runSkill === skill.slug && (
                <pre className="text-[10px] text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded p-2 max-h-40 overflow-y-auto whitespace-pre-wrap mt-1">
                  {runOutput}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
