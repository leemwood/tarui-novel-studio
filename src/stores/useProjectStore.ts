import { create } from 'zustand';
import type { Project, Entity, Relationship, Chapter, Message, Plan, NavSection } from '../types';

// Tauri invoke wrapper (works in both Tauri and browser)
async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
    return await tauriInvoke<T>(cmd, args);
  } catch {
    // Mock fallback for browser dev
    console.warn(`Tauri invoke not available for ${cmd}, using mock`);
    return mockInvoke<T>(cmd, args);
  }
}

// In-memory mock storage
const mockDb: Record<string, unknown[]> = {
  projects: [],
  entities: [],
  relationships: [],
  chapters: [],
  messages: [],
  plans: [],
};

function mockInvoke<T>(cmd: string, args?: Record<string, unknown>): T {
  const now = new Date().toISOString();
  
  if (cmd === 'create_project') {
    const p = { id: crypto.randomUUID(), name: args?.name as string, description: args?.description as string || '', created_at: now, updated_at: now };
    (mockDb.projects as Project[]).push(p);
    return p as T;
  }
  if (cmd === 'list_projects') return [...mockDb.projects] as T;
  if (cmd === 'get_project') return (mockDb.projects as Project[]).find(p => p.id === args?.id) as T;
  if (cmd === 'update_project') {
    const p = (mockDb.projects as Project[]).find(p => p.id === args?.id);
    if (p) { p.name = args?.name as string; p.description = args?.description as string; p.updated_at = now; }
    return p as T;
  }
  if (cmd === 'delete_project') { 
    mockDb.projects = (mockDb.projects as Project[]).filter(p => p.id !== args?.id);
    mockDb.entities = (mockDb.entities as Entity[]).filter(e => e.project_id !== args?.id);
    mockDb.relationships = (mockDb.relationships as Relationship[]).filter(r => r.project_id !== args?.id);
    mockDb.messages = (mockDb.messages as Message[]).filter(m => m.project_id !== args?.id);
    (mockDb.chapters as Chapter[]) = (mockDb.chapters as Chapter[]).filter(c => c.project_id !== args?.id);
    (mockDb.plans as Plan[]) = (mockDb.plans as Plan[]).filter(p => p.project_id !== args?.id);
    return undefined as T;
  }
  
  if (cmd === 'create_entity') {
    const e: Entity = { id: crypto.randomUUID(), project_id: args?.project_id as string, name: args?.name as string, entity_type: args?.entity_type as Entity['entity_type'], content: args?.content as string || '{}', created_at: now, updated_at: now };
    (mockDb.entities as Entity[]).push(e);
    return e as T;
  }
  if (cmd === 'list_entities') return (mockDb.entities as Entity[]).filter(e => e.project_id === args?.project_id) as T;
  if (cmd === 'get_entity') return (mockDb.entities as Entity[]).find(e => e.id === args?.id) as T;
  if (cmd === 'update_entity') {
    const e = (mockDb.entities as Entity[]).find(e => e.id === args?.id);
    if (e) { e.name = args?.name as string; e.entity_type = args?.entity_type as Entity['entity_type']; e.content = args?.content as string; e.updated_at = now; }
    return e as T;
  }
  if (cmd === 'delete_entity') {
    (mockDb.entities as Entity[]) = (mockDb.entities as Entity[]).filter(e => e.id !== args?.id);
    return undefined as T;
  }
  
  if (cmd === 'create_relationship') {
    const r: Relationship = { id: crypto.randomUUID(), project_id: args?.project_id as string, source_entity_id: args?.source_entity_id as string, target_entity_id: args?.target_entity_id as string, relationship_type: args?.relationship_type as string || '', description: args?.description as string || '', created_at: now };
    (mockDb.relationships as Relationship[]).push(r);
    return r as T;
  }
  if (cmd === 'list_relationships') return (mockDb.relationships as Relationship[]).filter(r => r.project_id === args?.project_id) as T;
  if (cmd === 'delete_relationship') { (mockDb.relationships as Relationship[]) = (mockDb.relationships as Relationship[]).filter(r => r.id !== args?.id); return undefined as T; }

  if (cmd === 'save_message') {
    const m: Message = { id: crypto.randomUUID(), project_id: args?.project_id as string, role: args?.role as Message['role'], content: args?.content as string, created_at: now };
    (mockDb.messages as Message[]).push(m);
    return m as T;
  }
  if (cmd === 'list_messages') return (mockDb.messages as Message[]).filter(m => m.project_id === args?.project_id) as T;
  if (cmd === 'clear_messages') { (mockDb.messages as Message[]) = (mockDb.messages as Message[]).filter(m => m.project_id !== args?.project_id); return undefined as T; }
  
  if (cmd === 'save_plan') {
    const p: Plan = { id: crypto.randomUUID(), project_id: args?.project_id as string, title: args?.title as string, content: args?.content as string, created_at: now };
    (mockDb.plans as Plan[]).push(p);
    return p as T;
  }
  if (cmd === 'list_plans') return (mockDb.plans as Plan[]).filter(p => p.project_id === args?.project_id) as T;

  return undefined as T;
}

interface ProjectStore {
  // Current selection
  currentProject: Project | null;
  activeNav: NavSection;
  selectedEntityId: string | null;
  selectedRelationshipId: string | null;
  selectedPlanId: string | null;
  
  // Data
  projects: Project[];
  entities: Entity[];
  relationships: Relationship[];
  chapters: Chapter[];
  messages: Message[];
  plans: Plan[];
  
  // Loading states
  loading: boolean;
  
  // Actions
  setActiveNav: (nav: NavSection) => void;
  setCurrentProject: (project: Project | null) => void;
  setSelectedEntityId: (id: string | null) => void;
  
  // CRUD
  loadProjects: () => Promise<void>;
  createProject: (name: string, description: string) => Promise<Project>;
  loadProjectData: (projectId: string) => Promise<void>;
  
  loadEntities: () => Promise<void>;
  createEntity: (name: string, entityType: string, content?: string) => Promise<Entity>;
  updateEntity: (id: string, name: string, entityType: string, content: string) => Promise<Entity>;
  deleteEntity: (id: string) => Promise<void>;
  
  loadRelationships: () => Promise<void>;
  createRelationship: (sourceId: string, targetId: string, type: string, desc: string) => Promise<Relationship>;
  
  saveMessage: (role: string, content: string) => Promise<Message>;
  loadMessages: () => Promise<void>;
  clearMessages: () => Promise<void>;
  
  savePlan: (title: string, content: string) => Promise<Plan>;
  loadPlans: () => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  currentProject: null,
  activeNav: 'project',
  selectedEntityId: null,
  selectedRelationshipId: null,
  selectedPlanId: null,
  
  projects: [],
  entities: [],
  relationships: [],
  chapters: [],
  messages: [],
  plans: [],
  
  loading: false,
  
  setActiveNav: (nav) => set({ activeNav: nav, selectedEntityId: null, selectedRelationshipId: null, selectedPlanId: null }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  
  loadProjects: async () => {
    const projects = await invoke<Project[]>('list_projects');
    set({ projects });
  },
  
  createProject: async (name, description) => {
    const project = await invoke<Project>('create_project', { name, description });
    set((s) => ({ projects: [...s.projects, project], currentProject: project }));
    return project;
  },
  
  loadProjectData: async (projectId) => {
    set({ loading: true });
    const [entities, relationships, chapters, messages, plans] = await Promise.all([
      invoke<Entity[]>('list_entities', { projectId }),
      invoke<Relationship[]>('list_relationships', { projectId }),
      invoke<Chapter[]>('list_chapters', { projectId }),
      invoke<Message[]>('list_messages', { projectId }),
      invoke<Plan[]>('list_plans', { projectId }),
    ]);
    set({ entities, relationships, chapters, messages, plans, loading: false });
  },
  
  loadEntities: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    const entities = await invoke<Entity[]>('list_entities', { projectId: currentProject.id });
    set({ entities });
  },
  
  createEntity: async (name, entityType, content = '{}') => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project selected');
    const entity = await invoke<Entity>('create_entity', {
      projectId: currentProject.id, name, entityType, content
    });
    set((s) => ({ entities: [...s.entities, entity] }));
    return entity;
  },
  
  updateEntity: async (id, name, entityType, content) => {
    const entity = await invoke<Entity>('update_entity', { id, name, entityType, content });
    set((s) => ({ entities: s.entities.map(e => e.id === id ? entity : e) }));
    return entity;
  },
  
  deleteEntity: async (id) => {
    await invoke('delete_entity', { id });
    set((s) => ({ entities: s.entities.filter(e => e.id !== id) }));
  },
  
  loadRelationships: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    const relationships = await invoke<Relationship[]>('list_relationships', { projectId: currentProject.id });
    set({ relationships });
  },
  
  createRelationship: async (sourceId, targetId, type, desc) => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project selected');
    const rel = await invoke<Relationship>('create_relationship', {
      projectId: currentProject.id, sourceEntityId: sourceId, targetEntityId: targetId,
      relationshipType: type, description: desc
    });
    set((s) => ({ relationships: [...s.relationships, rel] }));
    return rel;
  },
  
  saveMessage: async (role, content) => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project selected');
    const msg = await invoke<Message>('save_message', {
      projectId: currentProject.id, role, content
    });
    set((s) => ({ messages: [...s.messages, msg] }));
    return msg;
  },
  
  loadMessages: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    const messages = await invoke<Message[]>('list_messages', { projectId: currentProject.id });
    set({ messages });
  },
  
  clearMessages: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    await invoke('clear_messages', { projectId: currentProject.id });
    set({ messages: [] });
  },
  
  savePlan: async (title, content) => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project selected');
    const plan = await invoke<Plan>('save_plan', {
      projectId: currentProject.id, title, content
    });
    set((s) => ({ plans: [...s.plans, plan] }));
    return plan;
  },
  
  loadPlans: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    const plans = await invoke<Plan[]>('list_plans', { projectId: currentProject.id });
    set({ plans });
  },
}));
