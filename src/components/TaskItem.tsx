import React, { useState } from 'react';
import type { Task } from '../types';
import { Calendar, CheckCircle2, Circle, Clock, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface TaskItemProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: () => void;
}

export function TaskItem({ task, onUpdate, onDelete, onEdit }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);

  const handleStatusChange = async () => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await onUpdate(task.id, { status: newStatus });
  };

  const handleTitleUpdate = async () => {
    if (title.trim() !== task.title) {
      await onUpdate(task.id, { title: title.trim() });
    }
    setIsEditing(false);
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="group flex items-start gap-4 rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <button
        onClick={handleStatusChange}
        className="flex-shrink-0 mt-1"
      >
        {getStatusIcon()}
      </button>

      <div className="flex-1">
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleUpdate}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTitleUpdate();
              }
            }}
            className="w-full rounded border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer ${
              task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{task.title}</span>
              <AlertTriangle 
                className={`h-4 w-4 ${getPriorityColor()}`} 
                title={`Priority: ${task.priority}`}
              />
            </div>
          </div>
        )}
        
        {task.description && (
          <p className="mt-1 text-sm text-gray-500">{task.description}</p>
        )}
        
        {task.due_date && (
          <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            {format(new Date(task.due_date), 'PPp')}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="hidden text-gray-400 hover:text-blue-600 group-hover:block"
        >
          <Edit2 className="h-5 w-5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="hidden text-gray-400 hover:text-red-600 group-hover:block"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}