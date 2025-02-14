import React, { useState } from 'react';
import { useContextStore } from '../store/context';
import { X, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AIPersonality, PersonalInfo, Contact, ContextKeyword, AITrait } from '../types';
import { AIPersonalitySection } from './context/AIPersonalitySection';
import { PersonalInfoSection } from './context/PersonalInfoSection';
import { FileUploadSection } from './context/FileUploadSection';

interface ContextEditorProps {
  onClose: () => void;
  initialContext?: {
    id?: string;
    name: string;
    content: string;
    files?: string[];
    personal_info?: PersonalInfo;
    contacts?: Contact[];
    ai_personality?: AIPersonality;
    keywords?: ContextKeyword[];
  };
}

const DEFAULT_AI_TRAITS: AITrait[] = [
  {
    id: 'analytical',
    label: 'Analytical',
    description: 'Ability to break down complex problems and provide detailed analysis',
    level: 85
  },
  {
    id: 'creative',
    label: 'Creative',
    description: 'Capacity for innovative thinking and unique solutions',
    level: 80
  },
  {
    id: 'empathetic',
    label: 'Empathetic',
    description: 'Understanding and relating to emotional context',
    level: 90
  },
  {
    id: 'proactive',
    label: 'Proactive',
    description: 'Taking initiative and anticipating needs',
    level: 85
  },
  {
    id: 'adaptable',
    label: 'Adaptable',
    description: 'Flexibility in approach and learning',
    level: 80
  },
  {
    id: 'logical',
    label: 'Logical',
    description: 'Structured and rational thinking',
    level: 90
  },
  {
    id: 'knowledgeable',
    label: 'Knowledgeable',
    description: 'Broad understanding across multiple domains',
    level: 85
  }
];

export default function ContextEditor({ onClose, initialContext }: ContextEditorProps) {
  const { createContext, updateContext, deleteContext } = useContextStore();
  const [name, setName] = useState(initialContext?.name || 'Ultra');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [aiTraits, setAiTraits] = useState<AITrait[]>(
    initialContext?.ai_personality?.traits || DEFAULT_AI_TRAITS
  );
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(
    initialContext?.personal_info || {}
  );
  const [newTrait, setNewTrait] = useState<Partial<AITrait>>({});
  const [customInstructions, setCustomInstructions] = useState(
    initialContext?.content || 
    'I am Ultra, an advanced AI assistant focused on providing exceptional support through clear communication and proactive problem-solving. I maintain a professional yet approachable demeanor, always striving to understand context and deliver relevant, actionable insights.'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload files if any
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const filePath = `${user.id}/files/${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('context-files')
            .upload(filePath, file, {
              onUploadProgress: (progress) => {
                setUploadProgress((prev) => ({
                  ...prev,
                  [file.name]: (progress.loaded / progress.total) * 100,
                }));
              },
            });

          if (uploadError) throw uploadError;
          return file.name;
        })
      );

      // Prepare AI personality data
      const aiPersonality: AIPersonality = {
        name,
        traits: aiTraits,
        customInstructions
      };

      // Prepare the context data
      const contextData = {
        name,
        content: customInstructions,
        files: uploadedFiles,
        ai_personality: aiPersonality,
        personal_info: personalInfo,
        is_active: true
      };

      if (initialContext?.id) {
        await updateContext(initialContext.id, contextData);
      } else {
        await createContext(name, customInstructions, uploadedFiles);
      }
      onClose();
    } catch (error) {
      console.error('Error saving context:', error);
      alert('Failed to save context. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialContext?.id || !window.confirm('Are you sure you want to delete this context? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await deleteContext(initialContext.id);
      onClose();
    } catch (error) {
      console.error('Error deleting context:', error);
      alert('Failed to delete context. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {initialContext ? 'Edit AI Personality' : 'Create AI Personality'}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                AI Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="e.g., Ultra"
                required
              />
            </div>

            <AIPersonalitySection
              aiTraits={aiTraits}
              setAiTraits={setAiTraits}
              newTrait={newTrait}
              setNewTrait={setNewTrait}
              customInstructions={customInstructions}
              setCustomInstructions={setCustomInstructions}
            />

            <PersonalInfoSection
              personalInfo={personalInfo}
              setPersonalInfo={setPersonalInfo}
            />

            <FileUploadSection
              files={files}
              setFiles={setFiles}
              uploadProgress={uploadProgress}
              onFileChange={(e) => {
                const selectedFiles = Array.from(e.target.files || []);
                setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
              }}
              removeFile={(index) => {
                setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
                setUploadProgress((prev) => {
                  const newProgress = { ...prev };
                  delete newProgress[files[index].name];
                  return newProgress;
                });
              }}
            />

            <div className="flex justify-between pt-4">
              {initialContext?.id && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Context
                </button>
              )}
              <div className="flex gap-4 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-muted border border-muted rounded-md hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-button-text bg-primary rounded-md hover:bg-secondary disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Context'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export { ContextEditor }