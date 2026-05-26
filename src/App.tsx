import { useEffect } from 'react';
import { useProjectStore } from './stores/useProjectStore';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import ChatPanel from './components/chat/ChatPanel';
import EntityList from './components/entities/EntityList';
import EntityDetail from './components/entities/EntityDetail';
import RelationshipGraph from './components/entities/RelationshipGraph';
import PlanView from './components/entities/PlanView';
import ExportPanel from './components/entities/ExportPanel';

function RightPanel() {
  const { activeNav, selectedEntityId } = useProjectStore();

  if (activeNav === 'relationships') return <RelationshipGraph />;
  if (activeNav === 'plan') return <PlanView />;
  if (activeNav === 'project') return <ExportPanel />;
  if (selectedEntityId) return <EntityDetail />;
  return <EntityList />;
}

export default function App() {
  const { loadProjects } = useProjectStore();

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ChatPanel />
        <div className="w-80 border-l border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
