# Enhanced Personalization System Architecture

## Overview

The personalization system provides a comprehensive user experience through a persistent form interface combined with an AI-driven chatbot assistant. The system maintains user preferences and personal information that can be toggled on/off in the main chat interface.

## Core Features

### 1. Persistent Form Interface (PersonalizationPanel)

- Editable form fields that persistently store user information
- Categories:
  * Basic Information (name, email, phone)
  * Address Information
  * Professional Details (job, company, projects)
  * Personal Details (height, weight, sizes)
  * Interests & Preferences
  * Relationships
  * Identity & Worldview
  * Goals & Dreams
  * Health Information
  * Additional Notes
- All entered information persists until explicitly changed or deleted by the user
- Changes are automatically saved to the database

### 2. Interactive AI Chatbot

- Assists users in filling out their personalization profile
- Asks questions and encourages users to share personal details
- Automatically updates the form fields as users provide information through chat
- Information gathered through chat persists in the form fields
- Bidirectional sync between chatbot and form fields

### 3. Preferences Profile

- Generated from combined form field data
- Downloadable as PDF document
- Used for personalization in the main chat
- Accessible from the personalization area in the account page
- Can be downloaded for use in other applications

### 4. Personalization Toggle

- Available in the main chat interface
- Enables/disables personalization features
- When enabled, uses the Preferences Profile to personalize interactions
- When disabled, provides standard chat experience

### 5. File Management

- Upload capability for relevant files
- File viewer integrated into the personalization area
- Uploaded files are used alongside the Preferences Profile
- Files contribute to the personalization of the main chat

## Technical Implementation

### 1. State Management

```typescript
interface PersonalizationState {
  personalInfo: PersonalInfo;
  loading: boolean;
  error: string | null;
  isActive: boolean;
  hasSeenWelcome: boolean;
  initialized: boolean;
}

// Core operations
- fetchPersonalInfo(): Retrieve stored personalization data
- updatePersonalInfo(): Update and persist form field changes
- togglePersonalization(): Enable/disable personalization in main chat
- generatePreferencesProfile(): Create downloadable PDF
```

### 2. Database Schema

```sql
-- User personalization table
CREATE TABLE user_personalization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  personal_info JSONB,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personalization files table
CREATE TABLE personalization_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. AI Integration

The AIPersonalizationService handles:
- Interactive chat responses
- Form field updates from chat interactions
- Information extraction and persistence
- Context-aware suggestions

```typescript
interface ChatResponse {
  message: string;
  type: "response" | "question" | "suggestion";
  formUpdates?: Partial<PersonalInfo>; // Updates to persist in form
}

interface PreferencesProfile {
  personalInfo: PersonalInfo;
  files: PersonalizationFile[];
  preferences: {
    communication: string;
    learning: string;
    workStyle: string;
  };
  context_awareness: {
    background: string;
    current_focus: string;
    future_aspirations: string;
  };
}
```

### 4. UI Components

1. PersonalizationPanel
   - Persistent form interface
   - File management system
   - AI chatbot integration
   - PDF generation and download
   - Real-time save functionality

2. PersonalizationToggle
   - Enable/disable personalization
   - Visual feedback for active state
   - Integrated in main chat interface

3. FileManager
   - File upload interface
   - File viewer
   - File type validation
   - Storage management

### 5. Data Flow

1. User Input Methods:
   - Direct form field editing (persists automatically)
   - Chatbot interaction (updates form fields)
   - File uploads (stored and linked to profile)

2. Data Storage:
   - Automatic form field persistence
   - Real-time database updates
   - File storage and management
   - PDF generation and caching

3. Data Usage:
   - Main chat personalization
   - PDF profile generation
   - External application integration
   - Context-aware responses

### 6. Security & Privacy

- Row Level Security (RLS) policies
- Secure file storage
- Encrypted personal information
- User-specific access control
- Session management

## Implementation Status

### Completed
- Persistent form interface
- Database schema and migrations
- AI chatbot integration
- File management system
- PDF generation
- Personalization toggle
- Real-time updates

### In Progress
- Enhanced file type support
- Improved PDF formatting
- Advanced personalization algorithms

### Future Enhancements
- Additional file analysis
- Enhanced context generation
- Profile sharing capabilities
- Version control for profiles