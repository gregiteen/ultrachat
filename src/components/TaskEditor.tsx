import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { Calendar, Clock, Tag, Plus, Trash2, MessageSquare } from 'lucide-react';
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

export function TaskEditor({ onClose, onSave, initialTask }: TaskEditorProps) {
  type PriorityOption = SelectOption<Task['priority']>;
  type StatusOption = SelectOption<Task['status']>;

  const { processTaskRequest } = useTaskStore();
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
  const [loading, setLoading] = useState(false);
  const [showNLInput, setShowNLInput] = useState(false);
  const [nlInput, setNLInput] = useState('');
  const [processingNL, setProcessingNL] = useState(false);

  const handleNLSubmit = async () => {
    if (!nlInput.trim()) return;
    setProcessingNL(true);
    try {
      const result = await processTaskRequest(nlInput);
      if (result.success) {
        // The task will be created through the chain
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
    setSubtasks([...subtasks, { title: '', status: 'todo' as const }]);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleUpdateSubtask = (index: number, title: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index].title = title;
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
      };

      await onSave(task);

      // Create subtasks if any
      if (subtasks.length > 0 && task.id) {
        for (const subtask of subtasks) {
          await onSave({
            title: subtask.title,
            status: 'todo',
            priority: priority.value,
            parent_id: task.id
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
      <div className="bg-white rounded-lg w-full max-w-md">
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
                    onChange={(e) => handleUpdateSubtask(index, e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Subtask title"
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