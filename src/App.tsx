import { useEffect, useState } from 'react';
import { useProjectStore } from './stores/useProjectStore';
import { useAuthStore } from './stores/useAuthStore';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import ChatPanel from './components/chat/ChatPanel';
import EntityList from './components/entities/EntityList';
import EntityDetail from './components/entities/EntityDetail';
import RelationshipGraph from './components/entities/RelationshipGraph';
import PlanView from './components/entities/PlanView';
import ExportPanel from './components/entities/ExportPanel';
import SkillPanel from './components/entities/SkillPanel';
import Login from './pages/Login';
import Setup from './pages/Setup';

function RightPanel() {
  const { activeNav, selectedEntityId, rightPanelOpen } = useProjectStore();

  const content = (() => {
    if (activeNav === 'chat') return null;
    if (activeNav === 'skill') return <SkillPanel />;
    if (activeNav === 'relationships') return <RelationshipGraph />;
    if (activeNav === 'plan') return <PlanView />;
    if (activeNav === 'project') return <ExportPanel />;
    if (selectedEntityId) return <EntityDetail />;
    return <EntityList />;
  })();

  if (activeNav === 'chat') return null;

  return (
    <>
      <div className="hidden lg:flex w-80 border-l border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 overflow-hidden shrink-0">
        {content}
      </div>
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

function MainApp() {
  const { loadProjects } = useProjectStore();

  useEffect(() => { loadProjects(); }, []);

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

export default function App() {
  const { token, initialized, checkHealth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth().finally(() => setLoading(false));
  }, []);

  // Loading
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-spin h-6 w-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full" />
      </div>
    );
  }

  // Not initialized → Setup
  if (initialized === false) {
    return <Setup />;
  }

  // Not logged in → Login
  if (!token) {
    return <Login />;
  }

  // Authenticated
  return <MainApp />;
}
