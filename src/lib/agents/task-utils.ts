import type { Task, AutomationRule, AutomationRuleInput } from '../../types';

export function validateDueDate(date: string | undefined): date is string {
  if (!date) return false;
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

export function assertDueDate(date: string | undefined): string {
  if (!validateDueDate(date)) {
    throw new Error('Invalid or missing due date');
  }
  return date;
}

export function createAutomationRule(input: AutomationRuleInput): AutomationRule {
  const rule: AutomationRule = {
    type: input.type,
    config: input.config,
    status: 'active'
  };
  return rule;
}

export function getTaskDueDate(task: Task): Date | null {
  if (!task.due_date) return null;
  const date = new Date(task.due_date);
  return isNaN(date.getTime()) ? null : date;
}

export function createFailedAutomationRule(
  input: AutomationRuleInput,
  error: string
): AutomationRule {
  return {
    type: input.type,
    config: input.config,
    status: 'failed',
    error
  };
}