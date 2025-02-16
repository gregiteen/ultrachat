-- Add default personalization document to personal_info
UPDATE user_personalization
SET personal_info = personal_info || '{
  "personalization_document": {
    "preferences": {
      "communication": "direct and friendly",
      "learning": "visual and hands-on",
      "workStyle": "collaborative"
    },
    "interests": ["technology", "innovation"],
    "expertise": ["software development"],
    "communication_style": {
      "tone": "professional yet casual",
      "formality": "adaptable",
      "detail_level": "balanced"
    },
    "personality_traits": ["analytical", "creative", "curious"],
    "goals": ["continuous learning", "professional growth"],
    "context_awareness": {
      "background": "Technology professional",
      "current_focus": "Improving communication and productivity",
      "future_aspirations": "Expanding knowledge and capabilities"
    }
  }
}'::jsonb
WHERE (personal_info->>'personalization_document') IS NULL;