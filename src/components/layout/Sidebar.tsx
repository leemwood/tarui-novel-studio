import { useProjectStore } from '../../stores/useProjectStore';
import { DEFAULT_NAV_ITEMS } from '../../types';
import * as Icons from 'lucide-react';
import { cn } from '../../lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FolderOpen: Icons.FolderOpen,
  Users: Icons.Users,
  Package: Icons.Package,
  MapPin: Icons.MapPin,
  BookOpen: Icons.BookOpen,
  Route: Icons.Route,
  FileText: Icons.FileText,
  Share2: Icons.Share2,
  ClipboardList: Icons.ClipboardList,
};

export default function Sidebar() {
  const { activeNav, setActiveNav, currentProject } = useProjectStore();

  return (
    <aside className="w-56 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <h1 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Tarui Novel Studio</h1>
        {currentProject && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{currentProject.name}</p>
        )}
      </div>
      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {DEFAULT_NAV_ITEMS.map((item) => {
          const IconComp = iconMap[item.icon] || Icons.Circle;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                activeNav === item.id
                  ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )}
            >
              <IconComp className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
