import React, { useState } from 'react';
import { elevenlabs, type Voice } from '../../lib/elevenlabs';
import { VoiceRecorder } from './VoiceRecorder';

interface VoiceClonerProps {
  onVoiceCreated?: (voice: Voice) => void;
  onClose?: () => void;
}

export function VoiceCloner({ onVoiceCreated, onClose }: VoiceClonerProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [recordings, setRecordings] = useState<Blob[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

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
    setRecordings(prev => [...prev, recording]);
    if (recordings.length < 2) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleCreate = async () => {
    if (!name) {
      setError('Please enter a name for your voice');
      return;
    }

    if (recordings.length < 1) {
      setError('Please provide at least one voice sample');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      // Convert recordings to Files
      const files = recordings.map((blob, index) => 
        new File([blob], `sample-${index + 1}.wav`, { type: 'audio/wav' })
      );

      const voice = await elevenlabs.addVoice(name, files, description);
      onVoiceCreated?.(voice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create voice');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background border border-muted rounded-lg max-w-2xl">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Voice Cloning</h2>
        
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
            <h3 className="text-lg font-medium">Recordings</h3>
            <div className="space-y-2">
              {recordings.map((recording, index) => (
                <div
                  key={index}
                  className="p-4 border border-muted rounded-lg"
                >
                  <audio
                    controls
                    src={URL.createObjectURL(recording)}
                    className="w-full"
                  />
                  <button
                    onClick={() => {
                      setRecordings(recordings.filter((_, i) => i !== index));
                      setCurrentStep(Math.min(currentStep, recordings.length - 2));
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
            disabled={isCreating || !name || recordings.length === 0}
            className="px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isCreating ? 'Creating Voice...' : 'Create Voice'}
          </button>
        </div>
      </div>
    </div>
  );
}