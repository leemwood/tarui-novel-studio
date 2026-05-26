import { useEffect } from 'react';
import { useProjectStore } from './stores/useProjectStore';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import ChatPanel from './components/chat/ChatPanel';
import EntityList from './components/entities/EntityList';
import EntityDetail from './components/entities/EntityDetail';
import RelationshipGraph from './components/entities/RelationshipGraph';
import PlanView from './components/entities/PlanView';
import ExportPanel from './components/entities/ExportPanel';

function RightPanel() {
  const { activeNav, selectedEntityId, rightPanelOpen } = useProjectStore();

  const content = (() => {
    if (activeNav === 'relationships') return <RelationshipGraph />;
    if (activeNav === 'plan') return <PlanView />;
    if (activeNav === 'project') return <ExportPanel />;
    if (selectedEntityId) return <EntityDetail />;
    return <EntityList />;
  })();

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden lg:flex w-80 border-l border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 overflow-hidden shrink-0">
        {content}
      </div>

      {/* Tablet/Mobile: overlay when toggled */}
      {rightPanelOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => useProjectStore.getState().toggleRightPanel()} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] shadow-xl bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const { loadProjects } = useProjectStore();

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen flex flex-col bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 overflow-hidden">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <ChatPanel />
          <RightPanel />
        </div>
      </div>
    </ErrorBoundary>
  );
}
