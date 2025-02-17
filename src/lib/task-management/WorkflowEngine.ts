import type { Task } from '../../types';

export interface ServiceAction<TContext = Record<string, unknown>> {
  type: string;
  handler: (task: Task, context: TContext) => Promise<void>;
  condition?: (task: Task, context: TContext) => boolean;
}

export interface ServiceIntegration {
  id: string;
  name: string;
  actions: Record<string, ServiceAction>;
}

export class WorkflowEngine {
  private integrations: Map<string, ServiceIntegration> = new Map();

  registerIntegration(integration: ServiceIntegration): void {
    this.integrations.set(integration.id, integration);
  }

  async executeAction(
    integrationId: string,
    actionName: string,
    task: Task,
    context: Record<string, unknown> = {}
  ): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    const action = integration.actions[actionName];
    if (!action) {
      throw new Error(`Action not found: ${actionName}`);
    }

    if (action.condition && !action.condition(task, context)) {
      return;
    }

    await action.handler(task, context);
  }

  async executeWorkflow(
    task: Task,
    workflow: Array<{
      integration: string;
      action: string;
      context?: Record<string, unknown>;
    }>
  ): Promise<void> {
    for (const step of workflow) {
      await this.executeAction(
        step.integration,
        step.action,
        task,
        step.context
      );
    }
  }
}

export const workflowEngine = new WorkflowEngine();