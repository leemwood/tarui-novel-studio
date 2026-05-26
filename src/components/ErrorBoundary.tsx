import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  handleRestart = () => {
    window.location.reload();
  };

  handleResetData = () => {
    localStorage.clear();
    indexedDB.databases?.().then(dbs =>
      dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name))
    );
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 p-6">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold">应用遇到了问题</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              发生了意外错误，请尝试以下操作：
            </p>

            {/* Error detail (collapsible) */}
            {err && (
              <details className="text-left bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                <summary className="text-xs text-zinc-400 cursor-pointer select-none">
                  错误详情
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-all font-mono">
                  {err.name}: {err.message}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-zinc-900 text-zinc-50 text-sm font-medium hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                重试
              </button>
              <button
                onClick={this.handleRestart}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                重启应用
              </button>
              <button
                onClick={this.handleResetData}
                className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
              >
                清除所有数据并重启
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              如果问题持续出现，请联系开发者
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
