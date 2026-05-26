import { create } from 'zustand';
import type { Project, Entity, Relationship, Chapter, Message, Plan, NavSection } from '../types';
import { api } from './useAuthStore';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await api(path, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

interface ProjectStore {
  currentProject: Project | null;
  activeNav: NavSection;
  selectedEntityId: string | null;
  selectedPlanId: string | null;

  projects: Project[];
  entities: Entity[];
  relationships: Relationship[];
  chapters: Chapter[];
  messages: Message[];
  plans: Plan[];

  loading: boolean;

  sidebarOpen: boolean;
  rightPanelOpen: boolean;

  setActiveNav: (nav: NavSection) => void;
  setCurrentProject: (project: Project | null) => void;
  setSelectedEntityId: (id: string | null) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  closeSidebar: () => void;

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
  selectedPlanId: null,

  projects: [],
  entities: [],
  relationships: [],
  chapters: [],
  messages: [],
  plans: [],
  loading: false,

  sidebarOpen: false,
  rightPanelOpen: false,

  setActiveNav: (nav) => set({ activeNav: nav, selectedEntityId: null, selectedPlanId: null, sidebarOpen: false }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  loadProjects: async () => {
    const projects = await apiFetch<Project[]>('/projects');
    set({ projects });
  },

  createProject: async (name, description) => {
    const project = await apiFetch<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    set((s) => ({ projects: [...s.projects, project], currentProject: project }));
    return project;
  },

  loadProjectData: async (projectId) => {
    set({ loading: true });
    const params = `?project_id=${encodeURIComponent(projectId)}`;
    const [entities, relationships, chapters, messages, plans] = await Promise.all([
      apiFetch<Entity[]>(`/entities${params}`),
      apiFetch<Relationship[]>(`/relationships${params}`),
      apiFetch<Chapter[]>(`/chapters${params}`),
      apiFetch<Message[]>(`/messages${params}`),
      apiFetch<Plan[]>(`/plans${params}`),
    ]);
    set({ entities, relationships, chapters, messages, plans, loading: false });
  },

  loadEntities: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    const entities = await apiFetch<Entity[]>(`/entities?project_id=${encodeURIComponent(currentProject.id)}`);
    set({ entities });
  },

  createEntity: async (name, entityType, content = '{}') => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project selected');
    const entity = await apiFetch<Entity>('/entities', {
      method: 'POST',
      body: JSON.stringify({ project_id: currentProject.id, name, entity_type: entityType, content }),
    });
    set((s) => ({ entities: [...s.entities, entity] }));
    return entity;
  },

  updateEntity: async (id, name, entityType, content) => {
    const entity = await apiFetch<Entity>(`/entities/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, entity_type: entityType, content }),
    });
    set((s) => ({ entities: s.entities.map(e => e.id === id ? entity : e) }));
    return entity;
  },

  deleteEntity: async (id) => {
    await apiFetch(`/entities/${id}`, { method: 'DELETE' });
    set((s) => ({ entities: s.entities.filter(e => e.id !== id) }));
  },

  loadRelationships: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    const relationships = await apiFetch<Relationship[]>(`/relationships?project_id=${encodeURIComponent(currentProject.id)}`);
    set({ relationships });
  },

  createRelationship: async (sourceId, targetId, type, desc) => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project selected');
    const rel = await apiFetch<Relationship>('/relationships', {
      method: 'POST',
      body: JSON.stringify({
        project_id: currentProject.id,
        source_entity_id: sourceId,
        target_entity_id: targetId,
        relationship_type: type,
        description: desc,
      }),
    });
    set((s) => ({ relationships: [...s.relationships, rel] }));
    return rel;
  },

  saveMessage: async (role, content) => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project selected');
    const msg = await apiFetch<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify({ project_id: currentProject.id, role, content }),
    });
    set((s) => ({ messages: [...s.messages, msg] }));
    return msg;
  },

  loadMessages: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    const messages = await apiFetch<Message[]>(`/messages?project_id=${encodeURIComponent(currentProject.id)}`);
    set({ messages });
  },

  clearMessages: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    await apiFetch(`/messages?project_id=${encodeURIComponent(currentProject.id)}`, { method: 'DELETE' });
    set({ messages: [] });
  },

  savePlan: async (title, content) => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project selected');
    const plan = await apiFetch<Plan>('/plans', {
      method: 'POST',
      body: JSON.stringify({ project_id: currentProject.id, title, content }),
    });
    set((s) => ({ plans: [...s.plans, plan] }));
    return plan;
  },

  loadPlans: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    const plans = await apiFetch<Plan[]>(`/plans?project_id=${encodeURIComponent(currentProject.id)}`);
    set({ plans });
  },
}));
