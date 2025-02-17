import React, { useState, useEffect, useRef } from 'react';
import { elevenlabs, type Voice, type VoiceModel, type UserSubscription } from '../../lib/elevenlabs';
import { VoiceRecorder } from './VoiceRecorder';
import { Spinner } from '../../design-system/components/feedback/Spinner';
import { Mic, Volume2, Info } from 'lucide-react';

interface VoiceClonerProps {
  initialVoice?: Voice;
  onVoiceCreated?: (voice: Voice) => void;
  onClose?: () => void;
}

export function VoiceCloner({ initialVoice, onVoiceCreated, onClose }: VoiceClonerProps) {
  const [name, setName] = useState(initialVoice?.name || '');
  const [description, setDescription] = useState(initialVoice?.description || '');
  const [recordings, setRecordings] = useState<Blob[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [models, setModels] = useState<VoiceModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [existingSamples, setExistingSamples] = useState<{ id: string; audio: Blob }[]>([]);
  const audioUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load available models
        const availableModels = await elevenlabs.getModels();
        setModels(availableModels);
        if (availableModels.length > 0) {
          setSelectedModel(availableModels[0].model_id);
        }

        // Load subscription info
        const userSubscription = await elevenlabs.getUserSubscription();
        setSubscription(userSubscription);

        // Load existing samples if editing
        if (initialVoice) {
          setIsLoadingSamples(true);
          const samples = await elevenlabs.getVoiceSamples(initialVoice.id);
          const sampleData = await Promise.all(
            samples.filter(sample => sample.preview_url).map(async (sample) => {
              const response = await fetch(sample.preview_url || '');
              const blob = await response.blob();
              return { id: sample.id, audio: blob };
            })
          );
          setExistingSamples(sampleData);
        }
      } catch (err) {
        console.error('Error loading voice data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load voice data');
      } finally {
        setIsLoadingSamples(false);
      }
    };
    loadData();
  }, [initialVoice]);

  // Cleanup audio URLs when component unmounts
  useEffect(() => {
    return () => {
      audioUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const createAndTrackAudioUrl = (blob: Blob): string => {
    const url = URL.createObjectURL(blob);
    audioUrlsRef.current.push(url);
    return url;
  };

  const cleanupAudioUrl = (url: string): void => {
    URL.revokeObjectURL(url);
    audioUrlsRef.current = audioUrlsRef.current.filter((u: string) => u !== url);
  };

  const steps = [
    {
      title: 'Sample 1',
      description: 'Record yourself reading a paragraph naturally',
    },
    {
      title: 'Sample 2',
      description: 'Read with more emotion and variation',
    },
    {
      title: 'Sample 3',
      description: 'Read in a different tone or style',
    },
  ];

  const handleRecordingComplete = (recording: Blob) => {
    if (subscription && recordings.length >= 10) {
      setError('Maximum number of samples reached for your subscription tier');
      return;
    }

    setRecordings(prev => [...prev, recording]);
    if (recordings.length < 2) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleAddSample = async (voiceId: string, recording: Blob) => {
    try {
      setUploadProgress((prev) => prev + (100 / recordings.length));
      const file = new File([recording], 'sample.wav', { type: 'audio/wav' });
      const sample = await elevenlabs.addVoiceSample(voiceId, file);
      
      if (!sample) {
        throw new Error('Failed to add voice sample');
      }
      
      // Refresh voice samples
      const samples = await elevenlabs.getVoiceSamples(voiceId);
      return samples;
    } catch (error) {
      console.error('Error adding voice sample:', error);
      throw error;
    }
  };

  const handleRemoveRecording = (index: number) => {
    setRecordings(recordings.filter((_, i) => i !== index));
    setCurrentStep(Math.min(currentStep, recordings.length - 2));
  };

  const handleCreate = async () => {
    if (!name) {
      setError('Please enter a name for your voice');
      return;
    }

    if (recordings.length < 1 && !initialVoice) {
      setError('Please provide at least one voice sample');
      return;
    }
    
    if (!selectedModel) {
      setError('Please select a voice model');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      let voice: Voice;
      
      if (initialVoice) {
        // Edit existing voice
        voice = await elevenlabs.editVoice(initialVoice.id, name, description);
        
        // Add new samples
        for (const recording of recordings) {
          try {
            await handleAddSample(voice.id, recording);
          } catch (err) {
            console.error('Error adding sample:', err);
            // Continue with remaining samples
          }
        }
      } else {
        // Convert recordings to Files
        const files = recordings.map((blob, index) => 
          new File([blob], `sample-${index + 1}.wav`, { type: 'audio/wav' })
        );

        // Create new voice with first sample
        voice = await elevenlabs.addVoice(name, [files[0]], description, {
          model_id: selectedModel
        });

        // Add remaining samples one by one
        for (let i = 1; i < files.length; i++) {
          try {
            await handleAddSample(voice.id, files[i]);
          } catch (err) {
            console.error('Error adding sample:', err);
          }
        }
      }

      onVoiceCreated?.(voice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create voice');
    } finally {
      setIsCreating(false);
      setUploadProgress(0);
    }
  };

  const remainingCharacters = subscription ? 
    subscription.character_limit - subscription.character_count : 0;

  return (
    <div className="p-6 space-y-6 bg-background border border-muted rounded-lg max-w-2xl">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">{initialVoice ? 'Edit Voice' : 'Voice Cloning'}</h2>

        {/* Subscription Info */}
        {subscription && remainingCharacters >= 0 && (
          <div className="p-4 bg-muted/10 rounded-lg">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Characters remaining: </span>
              {remainingCharacters.toLocaleString()}
            </div>
          </div>
        )}

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Voice Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-muted bg-input-background"
          >
            {models.map((model) => (
              <option key={model.model_id} value={model.model_id}>{model.name}</option>
            ))}
          </select>
        </div>
        
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Voice Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-muted bg-input-background"
              placeholder="Enter a name for your voice"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-muted bg-input-background"
              placeholder="Add a description for your voice"
              rows={3}
            />
          </div>
        </div>

        {/* Existing Samples */}
        {isLoadingSamples ? <Spinner className="w-8 h-8" /> : existingSamples.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Existing Samples</h3>
            <div className="space-y-2">
              {existingSamples.map((sample, index) => (
                <div
                  key={sample.id}
                  className="p-4 border border-muted rounded-lg"
                >
                  <audio
                    controls
                    src={createAndTrackAudioUrl(sample.audio)}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recording Steps */}
        <div className="space-y-6">
          <div className="flex gap-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex-1 p-2 rounded-lg border ${
                  index === currentStep
                    ? 'border-primary bg-primary/10'
                    : index < currentStep
                    ? 'border-secondary bg-secondary/10'
                    : 'border-muted'
                }`}
              >
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>
            ))}
          </div>

          {currentStep < steps.length && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{steps[currentStep].title}</h3>
              <p className="text-muted-foreground">
                {steps[currentStep].description}
              </p>
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                minDuration={5}
                maxDuration={120}
              />
            </div>
          )}
        </div>

        {/* Recordings Preview */}
        {recordings.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">New Recordings</h3>
            <div className="space-y-2">
              {recordings.map((recording, index) => (
                <div
                  key={index}
                  className="p-4 border border-muted rounded-lg"
                >
                  <audio
                    controls
                    src={createAndTrackAudioUrl(recording)}
                    className="w-full"
                  />
                  <button
                    onClick={() => {
                      handleRemoveRecording(index);
                    }}
                    className="mt-2 text-sm text-red-500 hover:text-red-600 transition-colors"
                  >
                    Remove Recording
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Uploading samples... {Math.round(uploadProgress)}%
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !name || (!initialVoice && recordings.length === 0)}
            className="px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isCreating ? 'Saving Voice...' : initialVoice ? 'Save Changes' : 'Create Voice'}
          </button>
        </div>
      </div>
    </div>
  );
}