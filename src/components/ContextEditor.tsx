import React, { useState } from 'react';
import { useContextStore } from '../store/context';
import { X, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AIPersonality, PersonalInfo, Contact, ContextKeyword, AITrait } from '../types';
import { AIPersonalitySection } from './context/AIPersonalitySection';
import { PersonalInfoSection } from './context/PersonalInfoSection';
import { FileUploadSection } from './context/FileUploadSection';
import { VoiceSection } from './context/VoiceSection';
import { KeywordsSection } from './context/KeywordsSection';

interface ContextEditorProps {
  onClose: () => void;
  initialContext?: {
    id?: string;
    name: string;
    ai_name: string;
    voice: {
      id?: string;
      name: string;
      description?: string;
      settings?: {
        stability: number;
        similarity_boost: number;
      };
    };
    content: string;
    files?: string[];
    personal_info?: PersonalInfo;
    contacts?: Contact[];
    ai_personality?: AIPersonality;
    keywords?: ContextKeyword[];
    personalization_document?: string;
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
  const [name, setName] = useState(initialContext?.name || '');
  const [loading, setLoading] = useState(false);
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
  const [aiName, setAiName] = useState(initialContext?.ai_name || '');
  const [voice, setVoice] = useState(initialContext?.voice || {
    name: '',
    settings: {
      stability: 0.75,
      similarity_boost: 0.75
    }
  });
  const [keywords, setKeywords] = useState<ContextKeyword[]>(initialContext?.keywords || []);
  const [personalizationDocument, setPersonalizationDocument] = useState(initialContext?.personalization_document || '');

  const isPersonalization = initialContext?.name === 'Personal Context';

  const generatePersonalizationDocument = () => {
    let doc = '';

    // Basic Information
    if (personalInfo.name) doc += `# ${personalInfo.name}'s Personal Profile\n\n`;
    if (personalInfo.mbti) doc += `MBTI Type: ${personalInfo.mbti}\n`;
    if (personalInfo.backstory) doc += `\n## Background\n${personalInfo.backstory}\n`;

    // Contact & Location
    doc += '\n## Contact Information\n';
    if (personalInfo.email) doc += `Email: ${personalInfo.email}\n`;
    if (personalInfo.phone) doc += `Phone: ${personalInfo.phone}\n`;
    if (personalInfo.address) {
      doc += 'Address:\n';
      if (personalInfo.address.street) doc += `${personalInfo.address.street}\n`;
      if (personalInfo.address.city && personalInfo.address.state) {
        doc += `${personalInfo.address.city}, ${personalInfo.address.state}`;
        if (personalInfo.address.zip) doc += ` ${personalInfo.address.zip}`;
        doc += '\n';
      }
      if (personalInfo.address.country) doc += `${personalInfo.address.country}\n`;
    }

    // Professional
    doc += '\n## Professional Life\n';
    if (personalInfo.job) doc += `Current Job: ${personalInfo.job}\n`;
    if (personalInfo.company) doc += `Company: ${personalInfo.company}\n`;
    if (personalInfo.projects) doc += `\nCurrent Projects:\n${personalInfo.projects}\n`;
    if (personalInfo.resume) doc += `\nProfessional Background:\n${personalInfo.resume}\n`;

    // Physical Characteristics
    doc += '\n## Physical Characteristics\n';
    if (personalInfo.height) doc += `Height: ${personalInfo.height}\n`;
    if (personalInfo.weight) doc += `Weight: ${personalInfo.weight}\n`;
    if (personalInfo.shoe_size) doc += `Shoe Size: ${personalInfo.shoe_size}\n`;
    if (personalInfo.clothing_sizes) {
      if (personalInfo.clothing_sizes.top) doc += `Top Size: ${personalInfo.clothing_sizes.top}\n`;
      if (personalInfo.clothing_sizes.bottom) doc += `Bottom Size: ${personalInfo.clothing_sizes.bottom}\n`;
    }

    // Health
    if (personalInfo.health_concerns && personalInfo.health_concerns.length > 0) {
      doc += '\n## Health Information\n';
      doc += `Health Concerns: ${personalInfo.health_concerns.join(', ')}\n`;
    }

    // Personal
    if (personalInfo.pets && personalInfo.pets.length > 0) {
      doc += '\n## Pets\n';
      doc += personalInfo.pets.join(', ') + '\n';
    }

    // Goals & Dreams
    if (personalInfo.goals || personalInfo.dreams) {
      doc += '\n## Aspirations\n';
      if (personalInfo.goals && personalInfo.goals.length > 0) {
        doc += 'Goals:\n- ' + personalInfo.goals.join('\n- ') + '\n';
      }
      if (personalInfo.dreams && personalInfo.dreams.length > 0) {
        doc += '\nDreams:\n- ' + personalInfo.dreams.join('\n- ') + '\n';
      }
    }

    // Interests & Preferences
    doc += '\n## Interests & Preferences\n';
    if (personalInfo.hobbies && personalInfo.hobbies.length > 0) {
      doc += `Hobbies: ${personalInfo.hobbies.join(', ')}\n`;
    }
    if (personalInfo.favorite_foods && personalInfo.favorite_foods.length > 0) {
      doc += `Favorite Foods: ${personalInfo.favorite_foods.join(', ')}\n`;
    }
    if (personalInfo.favorite_drinks && personalInfo.favorite_drinks.length > 0) {
      doc += `Favorite Drinks: ${personalInfo.favorite_drinks.join(', ')}\n`;
    }

    // Relationships
    doc += '\n## Relationships\n';
    if (personalInfo.family && personalInfo.family.length > 0) {
      doc += `Family Members: ${personalInfo.family.join(', ')}\n`;
    }
    if (personalInfo.friends && personalInfo.friends.length > 0) {
      doc += `Friends: ${personalInfo.friends.join(', ')}\n`;
    }
    if (personalInfo.love_interests && personalInfo.love_interests.length > 0) {
      doc += `Love Interests: ${personalInfo.love_interests.join(', ')}\n`;
    }

    // Cultural & Beliefs
    doc += '\n## Cultural Background & Beliefs\n';
    if (personalInfo.cultural_groups && personalInfo.cultural_groups.length > 0) {
      doc += `Cultural Groups: ${personalInfo.cultural_groups.join(', ')}\n`;
    }
    if (personalInfo.religion) doc += `Religion: ${personalInfo.religion}\n`;
    if (personalInfo.worldview) doc += `Worldview: ${personalInfo.worldview}\n`;

    return doc;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate personalization document if this is the personalization context
      const generatedDocument = isPersonalization ? generatePersonalizationDocument() : personalizationDocument;

      // Prepare AI personality data
      const aiPersonality: AIPersonality = {
        traits: aiTraits,
        customInstructions
      };

      // Prepare the context data
      const contextData = {
        name,
        ai_name: aiName,
        voice,
        content: customInstructions,
        files: initialContext?.files || [],
        ai_personality: aiPersonality,
        personal_info: personalInfo,
        keywords,
        personalization_document: generatedDocument,
        is_active: true,
        is_default: isPersonalization
      };

      if (initialContext?.id) {
        await updateContext(initialContext.id, contextData);
      } else {
        await createContext(name, customInstructions);
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
              {isPersonalization ? 'Personal Context' : (initialContext ? 'Edit Context' : 'Create Context')}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {!isPersonalization && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Context Name
                  </label>
                  <input
                    id="context-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="e.g., Work Context"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ai-name" className="block text-sm font-medium text-foreground mb-1">
                    AI Name
                  </label>
                  <input
                    id="ai-name"
                    type="text"
                    value={aiName}
                    onChange={(e) => setAiName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="e.g., Jarvis"
                  />
                </div>

                <VoiceSection voice={voice} setVoice={setVoice} />

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Custom Instructions
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary h-32 resize-none"
                    placeholder="Instructions for how the AI should behave in this context"
                  />
                </div>

                <KeywordsSection
                  keywords={keywords}
                  setKeywords={setKeywords}
                />
              </>
            )}

            {isPersonalization ? (
              <PersonalInfoSection
                personalInfo={personalInfo}
                setPersonalInfo={setPersonalInfo}
              />
            ) : (
              <AIPersonalitySection
                aiTraits={aiTraits}
                setAiTraits={setAiTraits}
                newTrait={newTrait}
                setNewTrait={setNewTrait}
                customInstructions={customInstructions}
                setCustomInstructions={setCustomInstructions}
              />
            )}

            {!isPersonalization && (
                <FileUploadSection
                    onChange={(paths) => {
                        if (initialContext?.id) {
                            updateContext(initialContext.id, { files: paths });
                        }
                    }}
                />
            )}

            <div className="flex justify-between pt-4">
              {initialContext?.id && !isPersonalization && (
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