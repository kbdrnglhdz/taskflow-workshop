export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: number;
  created_at: string;
  updated_at?: string;
}

export interface TaskInput {
  title: string;
  description?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  active: number;
}

export type FilterType = 'all' | 'active' | 'completed';