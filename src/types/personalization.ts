export interface PersonalInfo {
  name?: string;
  email?: string;
  preferences?: string[];
  interests?: string[];
  expertise_areas?: string[];
  communication_style?: string;
  learning_style?: string;
  work_style?: string;
  goals?: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  task?: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    due_date?: string;
  };
}

export interface PersonalizationDocument {
  preferences: {
    communication: 'formal' | 'casual' | 'direct' | 'detailed' | 'collaborative';
    learning: 'visual' | 'hands-on' | 'theoretical' | 'mixed';
    workStyle: 'independent' | 'collaborative' | 'structured' | 'flexible';
    storage: 'local' | 'google_drive' | 'none';
  };
  communication_style: {
    tone: 'professional' | 'friendly' | 'technical' | 'conversational';
    formality: 'formal' | 'semi-formal' | 'casual';
    detail_level: 'high' | 'medium' | 'low';
  };
  interests: string[];
  expertise: string[];
  goals: string[];  // Added goals array
  task_preferences: {
    notification_channels: string[];
    reminder_frequency: 'high' | 'medium' | 'low';
    preferred_tools: string[];
    automation_level: 'high' | 'medium' | 'low';
    collaboration_style: 'async' | 'sync' | 'mixed';
  };
  integrations?: {
    github?: {
      preferred_labels: string[];
      auto_assign: boolean;
      notification_level: 'all' | 'mentions' | 'none';
    };
    slack?: {
      preferred_channels: string[];
      notification_format: 'detailed' | 'summary' | 'minimal';
      use_threads: boolean;
    };
    calendar?: {
      auto_schedule: boolean;
      reminder_times: number[];
      working_hours: {
        start: string;
        end: string;
        timezone: string;
      };
    };
    google_drive?: {
      auto_save: boolean;
      folder_structure: string[];
      sync_frequency: 'realtime' | 'hourly' | 'daily';
      file_organization: 'auto' | 'manual';
    };
  };
}