-- Create prompt categories table
CREATE TABLE prompt_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES prompt_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name, parent_id)
);

-- Create prompt tags table
CREATE TABLE prompt_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Create prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  title TEXT NOT NULL,
  category UUID REFERENCES prompt_categories(id),
  tags JSONB DEFAULT '[]',
  favorite BOOLEAN DEFAULT false,
  personalization_state JSONB,
  search_state JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt_tags_map table for many-to-many relationship
CREATE TABLE prompt_tags_map (
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES prompt_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (prompt_id, tag_id)
);

-- Add indexes
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompt_categories_user_id ON prompt_categories(user_id);
CREATE INDEX idx_prompt_categories_parent_id ON prompt_categories(parent_id);

-- Add RLS policies
ALTER TABLE prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_tags_map ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Users can view their own categories"
  ON prompt_categories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON prompt_categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON prompt_categories
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON prompt_categories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Prompts policies
CREATE POLICY "Users can view their own prompts"
  ON prompts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prompts"
  ON prompts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
  ON prompts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
  ON prompts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Tags map policies
CREATE POLICY "Users can view their own prompt tags"
  ON prompt_tags_map
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM prompts
    WHERE prompts.id = prompt_tags_map.prompt_id
    AND prompts.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their own prompt tags"
  ON prompt_tags_map
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM prompts
    WHERE prompts.id = prompt_tags_map.prompt_id
    AND prompts.user_id = auth.uid()
  ));

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_prompt_categories_updated_at
  BEFORE UPDATE ON prompt_categories
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();