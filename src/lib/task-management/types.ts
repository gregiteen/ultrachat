import { Task } from '../../types';

export interface WorkflowAction {
  type: string;
  handler: (task: Task, context: any) => Promise<void>;
  condition?: (task: Task, context: any) => boolean;
}

export interface WorkflowTrigger {
  event: string;
  condition?: (task: Task) => boolean;
  actions: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  triggers: WorkflowTrigger[];
  enabled: boolean;
}

export interface ServiceIntegration {
  id: string;
  name: string;
  actions: Record<string, WorkflowAction>;
}

export interface ExecutionRecord {
  timestamp: Date;
  workflowId: string;
  taskId: string;
  success: boolean;
  error?: string;
}