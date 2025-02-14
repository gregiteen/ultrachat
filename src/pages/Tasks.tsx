import React, { useEffect, useState } from 'react';
import { useTaskStore } from '../store/task';
import { TaskItem } from '../components/TaskItem';
import { TaskEditor } from '../components/TaskEditor';
import { CheckSquare, Plus } from 'lucide-react';
import type { Task } from '../types';

export default function Tasks() {
  const { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask } = useTaskStore();
  const [showEditor, setShowEditor] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (task: Partial<Task>) => {
    await createTask(task);
    setShowEditor(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditor(true);
  };

  const handleUpdateTask = async (task: Partial<Task>) => {
    if (editingTask) {
      await updateTask(editingTask.id, task);
      setShowEditor(false);
      setEditingTask(undefined);
    }
  };

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-8">
          <div className="flex items-center gap-4">
            <CheckSquare className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          </div>

          {/* New Task Button */}
          <button
            onClick={() => {
              setEditingTask(undefined);
              setShowEditor(true);
            }}
            className="mt-6 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Add Task
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-8 pb-8 md:grid-cols-3">
            {/* Todo */}
            <div>
              <h2 className="mb-4 font-medium text-gray-700">To Do</h2>
              <div className="space-y-4">
                {todoTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                    onEdit={() => handleEditTask(task)}
                  />
                ))}
              </div>
            </div>

            {/* In Progress */}
            <div>
              <h2 className="mb-4 font-medium text-gray-700">In Progress</h2>
              <div className="space-y-4">
                {inProgressTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                    onEdit={() => handleEditTask(task)}
                  />
                ))}
              </div>
            </div>

            {/* Done */}
            <div>
              <h2 className="mb-4 font-medium text-gray-700">Done</h2>
              <div className="space-y-4">
                {doneTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                    onEdit={() => handleEditTask(task)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showEditor && (
        <TaskEditor
          onClose={() => {
            setShowEditor(false);
            setEditingTask(undefined);
          }}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
          initialTask={editingTask}
        />
      )}
    </div>
  );
}