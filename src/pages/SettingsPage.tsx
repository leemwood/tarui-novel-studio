import { useState, useEffect } from 'react';
import { useChatStore } from '../stores/useChatStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Settings, Save, Key, Globe, Cpu, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../stores/useAuthStore';

export default function SettingsPage() {
  const { settings, setSettings, loadSettings, saveSettings } = useChatStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await saveSettings({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-800 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
            <Settings className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">设置</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">配置 AI 模型连接</p>
          </div>
        </div>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              AI 模型配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" /> API 提供商
              </label>
              <select
                className="w-full h-10 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                value={settings.apiProvider}
                onChange={e => {
                  setSettings({ apiProvider: e.target.value as 'openai' | 'claude' });
                  saveSettings({ apiProvider: e.target.value as 'openai' | 'claude' });
                }}
              >
                <option value="openai">OpenAI</option>
                <option value="claude">Claude</option>
              </select>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" /> API Key
              </label>
              <Input
                type="password"
                placeholder="sk-..."
                value={settings.apiKey}
                onChange={e => setSettings({ apiKey: e.target.value })}
              />
              <p className="text-[11px] text-zinc-400">Key 仅保存在服务端，不会返回前端</p>
            </div>

            {/* Model */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" /> 模型
              </label>
              <Input
                value={settings.model}
                onChange={e => {
                  setSettings({ model: e.target.value });
                  saveSettings({ model: e.target.value });
                }}
              />
              <p className="text-[11px] text-zinc-400">如 gpt-4o、claude-3-opus-20240229</p>
            </div>

            {/* Base URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> API Base URL
              </label>
              <Input
                value={settings.baseUrl}
                onChange={e => {
                  setSettings({ baseUrl: e.target.value });
                  saveSettings({ baseUrl: e.target.value });
                }}
              />
              <p className="text-[11px] text-zinc-400">兼容 OpenAI 格式的 API 地址</p>
            </div>

            {/* Save button */}
            <div className="pt-2">
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                保存设置
              </Button>
              {saved && (
                <span className="inline-flex items-center gap-1 ml-3 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" /> 已保存
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">关于</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <p>Tarui Novel Studio - AI 辅助小说创作工具</p>
            <p>Go 后端 + React 前端，SQLite 存储</p>
            <p>支持 OpenAI / Claude API，可扩展 skill 工具</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
