import { useState, useEffect } from 'react';
import { useChatStore } from '../stores/useChatStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Settings, Save, Key, Globe, Cpu, CheckCircle, Loader2, Wifi } from 'lucide-react';
import { api } from '../stores/useAuthStore';

export default function SettingsPage() {
  const { settings, setSettings, loadSettings, saveSettings } = useChatStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

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

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api('/settings/test', {
        method: 'POST',
        body: JSON.stringify({
          api_provider: settings.apiProvider,
          api_key: settings.apiKey,
          api_model: settings.model,
          api_base_url: settings.baseUrl,
        }),
      });
      if (res.ok) {
        setTestResult({ ok: true, msg: '连接成功' });
      } else {
        const data = await res.json().catch(() => ({ error: '请求失败' }));
        setTestResult({ ok: false, msg: data.error || res.statusText });
      }
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.message });
    }
    setTesting(false);
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
                  const v = e.target.value;
                  setSettings({ apiProvider: v as any });
                  saveSettings({ apiProvider: v as any });
                  if (v === 'deepseek') {
                    setSettings({ model: 'deepseek-v4-flash', baseUrl: 'https://api.deepseek.com/v1' });
                    saveSettings({ model: 'deepseek-v4-flash', baseUrl: 'https://api.deepseek.com/v1' });
                  }
                }}
              >
                <option value="deepseek">DeepSeek</option>
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
              <p className="text-[11px] text-zinc-400">如 deepseek-v4-flash、gpt-4o、claude-3-opus</p>
            </div>

            {/* Thinking Mode */}
            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">思考模式</label>
                <p className="text-[11px] text-zinc-400">启用后 AI 会展示推理过程</p>
              </div>
              <button
                role="switch"
                aria-checked={settings.thinkingMode}
                onClick={() => {
                  const v = !settings.thinkingMode;
                  setSettings({ thinkingMode: v });
                  saveSettings({ thinkingMode: v });
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.thinkingMode ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.thinkingMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
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

            {/* Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                保存
              </Button>
              <Button variant="outline" onClick={handleTest} disabled={testing}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Wifi className="h-4 w-4 mr-1" />}
                测试连接
              </Button>
              {saved && (
                <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" /> 已保存
                </span>
              )}
            </div>
            {testResult && (
              <div className={`text-sm rounded-lg px-3 py-2 ${testResult.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300'}`}>
                {testResult.ok ? '连接成功 — API 正常工作' : `连接失败: ${testResult.msg}`}
              </div>
            )}
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
            <p>支持 DeepSeek / OpenAI / Claude API，可扩展 skill 工具</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
