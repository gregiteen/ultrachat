import React from 'react';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../design-system/components/feedback/Spinner';
import { usePersonalizationStore } from '../store/personalization';

interface PersonalizationButtonProps {
  isActive: boolean;
  onToggle: () => Promise<void>;
}

export function PersonalizationButton({ isActive, onToggle }: PersonalizationButtonProps) {
  const navigate = useNavigate();
  const { personalInfo, loading, error } = usePersonalizationStore();
  const hasPersonalization = !!(
    personalInfo.name || 
    personalInfo.email || 
    personalInfo.phone ||
    (personalInfo.interests && personalInfo.interests.length > 0) ||
    personalInfo.backstory || 
    personalInfo.projects || 
    personalInfo.resume
  );

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onToggle();
  };

  const handleSettings = () => {
    navigate('/account?tab=personalization');
  };

  return (
    <div className="flex items-center gap-1">
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors relative ${
          isActive
            ? 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10'
            : 'bg-primary text-white shadow-sm hover:bg-primary/90'
        }`}
        title={isActive ? 'Disable personalization' : 'Enable personalization'}
        disabled={loading}
      >
        {loading ? (
          <Spinner size="sm" className="absolute inset-0 m-auto" />
        ) : (
          <span className={`text-sm font-medium ${error ? 'text-destructive' : ''}`}>
            P
          </span>
        )}
      </button>

      {/* Settings Button */}
      <button
        onClick={handleSettings}
        className={`p-1.5 rounded-md transition-colors ${
          hasPersonalization
            ? 'text-primary hover:text-primary/80'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Personalization settings"
      >
        {error && <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />}
        <Settings className="h-4 w-4" />
      </button>
    </div>
  );
}