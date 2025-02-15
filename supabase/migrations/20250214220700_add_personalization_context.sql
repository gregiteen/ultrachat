-- Create function to create personalization context
CREATE OR REPLACE FUNCTION create_personalization_context()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contexts (
    user_id,
    name,
    ai_name,
    content,
    voice,
    is_active,
    is_default,
    personalization_document
  ) VALUES (
    NEW.id, -- user id
    'Personalize',
    'Personal Assistant',
    'I am your personal assistant, focused on understanding and supporting you through our conversations. I maintain a professional yet warm demeanor, always striving to provide relevant and helpful responses based on your personal context.',
    'warm, friendly voice',
    true,
    true,
    'Your personalization document will be automatically generated and maintained as you provide information.'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create personalization context on user creation
DROP TRIGGER IF EXISTS create_personalization_context_trigger ON auth.users;
CREATE TRIGGER create_personalization_context_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_personalization_context();