import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { Calendar, Clock, Tag, Plus, Trash2, MessageSquare, Repeat, Link, Bell } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";
import type { Task } from '../types';
import { useTaskStore } from '../store/task';

interface TaskEditorProps {
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  initialTask?: Task;
}

interface Subtask {
  title: string;
  status: Task['status'];
  estimated_duration?: string;
  parent_id?: string;
}

interface SelectOption<T> {
  value: T;
  label: string;
  color?: string;
}

type AutomationType = NonNullable<Task['automation_rules']>['type'];
type AutomationConfig = NonNullable<Task['automation_rules']>['config'];

const priorityOptions: SelectOption<Task['priority']>[] = [
  { value: 'low', label: 'Low', color: '#10B981' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'high', label: 'High', color: '#EF4444' }
];

const statusOptions: SelectOption<Task['status']>[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' }
];

const automationTypeOptions: SelectOption<AutomationType>[] = [
  { value: 'recurring', label: 'Recurring Task' },
  { value: 'dependent', label: 'Dependent Task' },
  { value: 'deadline', label: 'Deadline Notifications' }
];

const frequencyOptions: SelectOption<string>[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' }
];

export function TaskEditor({ onClose, onSave, initialTask }: TaskEditorProps) {
  type PriorityOption = SelectOption<Task['priority']>;
  type StatusOption = SelectOption<Task['status']>;
  type AutomationTypeOption = SelectOption<AutomationType>;
  type FrequencyOption = SelectOption<string>;

  const { processTaskRequest, listTasks } = useTaskStore();
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [dueDate, setDueDate] = useState<Date | null>(
    initialTask?.due_date ? new Date(initialTask.due_date) : null
  );
  const [priority, setPriority] = useState<PriorityOption>(
    priorityOptions.find(opt => opt.value === initialTask?.priority) || priorityOptions[0]
  );
  const [status, setStatus] = useState<StatusOption>(
    statusOptions.find(opt => opt.value === initialTask?.status) || statusOptions[0]
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [estimatedDuration, setEstimatedDuration] = useState(initialTask?.estimated_duration || '');
  const [loading, setLoading] = useState(false);
  const [showNLInput, setShowNLInput] = useState(false);
  const [nlInput, setNLInput] = useState('');
  const [processingNL, setProcessingNL] = useState(false);

  // Automation states
  const [showAutomation, setShowAutomation] = useState(false);
  const [automationType, setAutomationType] = useState<AutomationTypeOption | null>(
    initialTask?.automation_rules ? {
      value: initialTask.automation_rules.type,
      label: automationTypeOptions.find(opt => opt.value === initialTask.automation_rules?.type)?.label || ''
    } : null
  );
  const [frequency, setFrequency] = useState<FrequencyOption | null>(
    initialTask?.automation_rules?.config.frequency ? {
      value: initialTask.automation_rules.config.frequency,
      label: frequencyOptions.find(opt => opt.value === initialTask.automation_rules?.config.frequency)?.label || ''
    } : null
  );
  const [dependencies, setDependencies] = useState<string[]>(
    initialTask?.automation_rules?.config.dependsOn || []
  );
  const [notifyBefore, setNotifyBefore] = useState<number>(
    initialTask?.automation_rules?.config.notifyBefore || 24
  );
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

  React.useEffect(() => {
    const loadTasks = async () => {
      try {
        const tasks = await listTasks();
        setAvailableTasks(tasks.filter(t => t.id !== initialTask?.id));
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };
    loadTasks();
  }, [initialTask?.id, listTasks]);

  const handleNLSubmit = async () => {
    if (!nlInput.trim()) return;
    setProcessingNL(true);
    try {
      const result = await processTaskRequest(nlInput);
      if (result.success) {
        onClose();
      } else {
        console.error('Failed to process task:', result.message);
      }
    } catch (error) {
      console.error('Error processing natural language input:', error);
    } finally {
      setProcessingNL(false);
    }
  };

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { 
      title: '', 
      status: 'todo' as const,
      estimated_duration: '1' // Default 1 hour
    }]);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleUpdateSubtask = (index: number, updates: Partial<Subtask>) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = { ...newSubtasks[index], ...updates };
    setSubtasks(newSubtasks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const task: Partial<Task> = {
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate?.toISOString(),
        priority: priority.value,
        status: status.value,
        estimated_duration: estimatedDuration,
      };

      // Add automation rules if configured
      if (automationType) {
        task.automation_rules = {
          type: automationType.value,
          status: 'active',
          config: {
            ...(automationType.value === 'recurring' && frequency 
              ? { frequency: frequency.value }
              : {}),
            ...(automationType.value === 'dependent' && dependencies.length > 0
              ? { dependsOn: dependencies }
              : {}),
            ...(automationType.value === 'deadline'
              ? { notifyBefore }
              : {})
          }
        };
      }

      await onSave(task);

      // Create subtasks if any
      if (subtasks.length > 0 && task.id) {
        for (const subtask of subtasks) {
          await onSave({
            title: subtask.title,
            status: 'todo',
            priority: priority.value,
            parent_id: task.id,
            estimated_duration: subtask.estimated_duration
          });
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showNLInput) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Create Task</h2>
            <button
              onClick={() => setShowNLInput(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            <textarea
              value={nlInput}
              onChange={(e) => setNLInput(e.target.value)}
              placeholder="Describe your task in natural language..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNLInput(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleNLSubmit}
                disabled={processingNL || !nlInput.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {processingNL ? 'Processing...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {initialTask ? 'Edit Task' : 'New Task'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNLInput(true)}
                className="text-blue-600 hover:text-blue-700"
                title="Use natural language"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div className="relative">
                <DatePicker
                  selected={dueDate}
                  onChange={setDueDate}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholderText="Select date"
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <Select
                value={priority}
                onChange={(option) => option && setPriority(option)}
                options={priorityOptions}
                className="react-select"
                classNamePrefix="react-select"
                formatOptionLabel={({ value, label, color }) => (
                  <div className="flex items-center">
                    <span
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                  </div>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Duration (hours)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter duration"
              />
            </div>

            {initialTask && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={status}
                  onChange={(option) => option && setStatus(option)}
                  options={statusOptions}
                  className="react-select"
                  classNamePrefix="react-select"
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Automation
              </label>
              <button
                type="button"
                onClick={() => setShowAutomation(!showAutomation)}
                className="text-blue-600 hover:text-blue-700"
              >
                {showAutomation ? 'Hide' : 'Show'}
              </button>
            </div>

            {showAutomation && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Automation Type
                  </label>
                  <Select
                    value={automationType}
                    onChange={(option) => {
                      setAutomationType(option);
                      setFrequency(null);
                      setDependencies([]);
                    }}
                    options={automationTypeOptions}
                    className="react-select"
                    classNamePrefix="react-select"
                  />
                </div>

                {automationType?.value === 'recurring' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <Select
                      value={frequency}
                      onChange={(option) => setFrequency(option)}
                      options={frequencyOptions}
                      className="react-select"
                      classNamePrefix="react-select"
                    />
                  </div>
                )}

                {automationType?.value === 'dependent' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dependencies
                    </label>
                    <Select
                      isMulti
                      value={availableTasks
                        .filter(t => dependencies.includes(t.id))
                        .map(t => ({ value: t.id, label: t.title }))}
                      onChange={(options) => setDependencies(options.map(o => o.value))}
                      options={availableTasks.map(t => ({
                        value: t.id,
                        label: t.title
                      }))}
                      className="react-select"
                      classNamePrefix="react-select"
                    />
                  </div>
                )}

                {automationType?.value === 'deadline' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notify Before (hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={notifyBefore}
                      onChange={(e) => setNotifyBefore(parseInt(e.target.value))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Subtasks
              </label>
              <button
                type="button"
                onClick={handleAddSubtask}
                className="text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={subtask.title}
                    onChange={(e) => handleUpdateSubtask(index, { title: e.target.value })}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Subtask title"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={subtask.estimated_duration}
                    onChange={(e) => handleUpdateSubtask(index, { estimated_duration: e.target.value })}
                    className="w-24 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Hours"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}