export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export type EntityType = 'character' | 'item' | 'location' | 'lore' | 'plot' | 'chapter';

export interface Entity {
  id: string;
  project_id: string;
  name: string;
  entity_type: EntityType;
  content: string; // JSON string with type-specific fields
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  project_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  description: string;
  created_at: string;
}

export interface Chapter {
  id: string;
  project_id: string;
  title: string;
  content: string;
  chapter_number: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Plan {
  id: string;
  project_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface EntityContent {
  // character
  age?: string;
  gender?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  abilities?: string;
  // item
  item_description?: string;
  item_properties?: string;
  // location
  location_description?: string;
  inhabitants?: string;
  significance?: string;
  // lore
  lore_summary?: string;
  lore_details?: string;
  // plot
  plot_summary?: string;
  arc?: string;
  status?: string;
  // chapter
  chapter_summary?: string;
  scenes?: string[];
  word_count?: number;
}

// Navigation items
export type NavSection =
  | 'project'
  | 'characters'
  | 'items'
  | 'locations'
  | 'lore'
  | 'plots'
  | 'chapters'
  | 'relationships'
  | 'plan'
  | 'chat'
  | 'skill';

export interface SidebarSection {
  id: NavSection;
  label: string;
  icon: string;
}

export interface AiToolCall {
  name: 'create_entity' | 'update_entity' | 'create_relationship' | 'generate_plan';
  arguments: Record<string, string>;
}

export interface ChatSettings {
  apiProvider: 'openai' | 'claude';
  apiKey: string;
  model: string;
  baseUrl: string;
}

export const DEFAULT_NAV_ITEMS: SidebarSection[] = [
  { id: 'project', label: '项目', icon: 'FolderOpen' },
  { id: 'chat', label: '聊天', icon: 'MessageSquare' },
  { id: 'characters', label: '角色', icon: 'Users' },
  { id: 'items', label: '道具', icon: 'Package' },
  { id: 'locations', label: '地点', icon: 'MapPin' },
  { id: 'lore', label: '设定', icon: 'BookOpen' },
  { id: 'plots', label: '剧情', icon: 'Route' },
  { id: 'chapters', label: '章节', icon: 'FileText' },
  { id: 'relationships', label: '关系', icon: 'Share2' },
  { id: 'skill', label: '技能', icon: 'Zap' },
  { id: 'plan', label: '开发计划', icon: 'ClipboardList' },
];
