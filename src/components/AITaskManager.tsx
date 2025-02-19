import React, { useState } from 'react';
import { TaskAssistant } from './TaskAssistant';
import { TaskEditor } from './TaskEditor';
import type { Task } from '../types/task';
import { useTaskStore } from '../store/task';

export function AITaskManager() {
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const { createTask, updateTask } = useTaskStore();

  const handleTaskSave = async (task: Partial<Task>) => {
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, task);
      } else {
        await createTask(task);
      }
      setShowTaskEditor(false);
      setSelectedTask(undefined);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Task Management Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-semibold">Task Management</h1>
          <button
            onClick={() => {
              setSelectedTask(undefined);
              setShowTaskEditor(true);
            }}
            className="px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors"
          >
            New Task
          </button>
        </div>

        {/* Task Editor Modal */}
        {showTaskEditor && (
          <TaskEditor
            onClose={() => {
              setShowTaskEditor(false);
              setSelectedTask(undefined);
            }}
            onSave={handleTaskSave}
            initialTask={selectedTask}
          />
        )}
      </div>

      {/* AI Assistant Panel */}
      <div className="w-96 border-l flex flex-col bg-card">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">
            Ask me anything about task management, scheduling, or automation.
          </p>
        </div>
        <div className="flex-1">
          <TaskAssistant
            onCreateTask={() => {
              setSelectedTask(undefined);
              setShowTaskEditor(true);
            }}
            onEditTask={(task: Task) => {
              setSelectedTask(task);
              setShowTaskEditor(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}