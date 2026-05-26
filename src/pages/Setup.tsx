import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { KeyRound, Loader2 } from 'lucide-react';

export default function Setup() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const { setup, loading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 4) { setError('密码至少 4 位'); return; }
    if (password !== confirm) { setError('两次密码不一致'); return; }
    try {
      await setup(password);
    } catch (err: any) {
      setError(err.message || '设置失败');
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
          </div>
          <h1 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">首次设置</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">设置管理员密码</p>
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 text-center">
            {error}
          </div>
        )}

        <input
          type="password"
          placeholder="设置密码（至少 4 位）"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full h-11 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          autoFocus
        />
        <input
          type="password"
          placeholder="确认密码"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full h-11 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg bg-zinc-900 text-zinc-50 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? '设置中...' : '确认并开始'}
        </button>
      </form>
    </div>
  );
}
