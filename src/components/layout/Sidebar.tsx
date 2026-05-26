import { useProjectStore } from '../../stores/useProjectStore';
import { DEFAULT_NAV_ITEMS } from '../../types';
import * as Icons from 'lucide-react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FolderOpen: Icons.FolderOpen,
  MessageSquare: Icons.MessageSquare,
  Users: Icons.Users,
  Package: Icons.Package,
  MapPin: Icons.MapPin,
  BookOpen: Icons.BookOpen,
  Route: Icons.Route,
  FileText: Icons.FileText,
  Share2: Icons.Share2,
  Zap: Icons.Zap,
  Settings: Icons.Settings,
  ClipboardList: Icons.ClipboardList,
};

export default function Sidebar() {
  const { activeNav, setActiveNav, currentProject, sidebarOpen, closeSidebar } = useProjectStore();

  const navContent = (
    <aside className={cn(
      'w-56 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex flex-col h-full'
    )}>
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
        <h1 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex-1">Tarui Novel Studio</h1>
        {/* Close button visible only on mobile */}
        <button onClick={closeSidebar} className="lg:hidden p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">
          <X className="h-4 w-4 text-zinc-500" />
        </button>
      </div>
      {currentProject && (
        <div className="px-4 pb-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{currentProject.name}</p>
        </div>
      )}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {DEFAULT_NAV_ITEMS.map((item) => {
          const IconComp = iconMap[item.icon] || Icons.Circle;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveNav(item.id); closeSidebar(); }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors min-h-[40px]',
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

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <div className="hidden lg:flex shrink-0">
        {navContent}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={closeSidebar} />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 shadow-xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
