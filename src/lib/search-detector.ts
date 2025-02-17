import { gemini } from './gemini';
import { usePersonalizationStore } from '../store/personalization';

// List of phrases that indicate a personal query
const PERSONAL_QUERIES = [
  'who am i',
  'what is my name',
  'what do i do',
  'tell me about myself',
  'what are my interests',
  'what is my background',
  'my profile',
  'my information',
  'about me'
];

// Check if the content contains any personal query phrases
function isPersonalQuery(content: string): boolean {
  const normalizedContent = content.toLowerCase();
  return PERSONAL_QUERIES.some(query => normalizedContent.includes(query));
}

export async function shouldPerformSearch(content: string): Promise<boolean> {
  try {
    console.log('Checking if search needed for:', content);

    // First check if this is a personal query
    if (isPersonalQuery(content)) {
      const isPersonalizationActive = usePersonalizationStore.getState().isActive;
      const personalInfo = usePersonalizationStore.getState().personalInfo;
      
      // If we have personalization data, don't search for personal queries
      if (isPersonalizationActive && personalInfo?.personalization_document) {
        console.log('Personal query detected with active personalization - skipping search');
        return false;
      }
    }

    // For non-personal queries or when personalization is not available,
    // check if we need to search
    const searchCheckPrompt = `Given this user message, determine if an internet search would be helpful:

User message: "${content}"

IMPORTANT: Return ONLY "true" if ANY of these apply:
1. Questions about facts, data, or information that could be verified
2. Questions about current events, news, or developments
3. Sports-related queries (scores, results, standings, etc.)
4. Questions about "latest", "current", "recent", or time-sensitive topics
5. Factual queries that might change or be updated over time
6. Questions about "who", "what", "where", "when", "why", or "how"
7. Requests for examples, comparisons, or references
8. Questions about products, services, or technologies
9. Requests for tutorials, guides, or documentation
10. Questions about best practices or industry standards
11. Direct or implicit requests for search/research
12. Questions that might benefit from multiple sources

IMPORTANT: When in doubt, return "true" to provide comprehensive information.
Return ONLY "true" or "false" with no explanation or additional text.`;

    const searchCheck = await gemini.generateText(searchCheckPrompt);
    const shouldSearch = searchCheck.trim().toLowerCase() === 'true';
    console.log('Search decision:', shouldSearch);
    return shouldSearch;
  } catch (error) {
    console.error('Error in search detection:', error);
    // If there's an error in detection, default to searching unless it's a personal query
    return !isPersonalQuery(content) && content.includes('?');
  }
}