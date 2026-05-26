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

function MainContent() {
  const { activeNav, selectedEntityId } = useProjectStore();

  switch (activeNav) {
    case 'chat':
      return <ChatPanel />;
    case 'skill':
      return <SkillPanel />;
    case 'relationships':
      return <RelationshipGraph />;
    case 'plan':
      return <PlanView />;
    case 'project':
      return <ExportPanel />;
    default:
      // entity navs: characters/items/locations/lore/plots/chapters
      if (selectedEntityId) return <EntityDetail />;
      return <EntityList />;
  }
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
          <MainContent />
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
