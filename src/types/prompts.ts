export interface Prompt {
  id: string;
  user_id: string;
  content: string;
  title: string;
  category: string;
  tags: string[];
  favorite: boolean;
  personalization_state?: {
    isActive: boolean;
    context: {
      name?: string;
      preferences?: any;
      interests?: string[];
      expertise_areas?: string[];
    };
  };
  search_state?: {
    wasSearchPerformed: boolean;
    searchContext?: any;
  };
  metadata?: {
    assistant?: string;
    personalization?: boolean;
    search?: boolean;
    tools?: string[];
  };
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  parent_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface PromptTag {
  id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface PromptWithCategory extends Prompt {
  category_details: Category;
  tags_details: PromptTag[];
}