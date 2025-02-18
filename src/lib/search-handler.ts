import { searchService } from './search-service';
import { shouldPerformSearch } from './search-detector';
import { formatSearchResults } from './search-formatter';
import { usePersonalizationStore } from '../store/personalization';
import type { SearchResponse } from '../types';

export interface SearchResult {
  content: string;
  wasSearchPerformed: boolean;
}

export async function handleSearch(content: string, forceSearch: boolean = false): Promise<SearchResult> {
  try {
    // Check if this is a personal query
    const personalInfo = usePersonalizationStore.getState().personalInfo;
    const isPersonalizationActive = usePersonalizationStore.getState().isActive;
    
    // Check for personal info queries when personalization is active
    if (isPersonalizationActive && 
        (content.toLowerCase().includes('who am i') ||
         content.toLowerCase().includes("what's my name") ||
         content.toLowerCase().includes("what is my name") ||
         content.toLowerCase().includes('my name') ||
         content.toLowerCase().includes('tell me about myself')) && 
        personalInfo?.personalization_document) {
      // Create a comprehensive personal response
      const response = `
# About You

${personalInfo.name ? `You are ${personalInfo.name}. ` : ''}${personalInfo.backstory || ''}

## Interests & Expertise
${personalInfo.interests?.length ? `\nInterests: ${personalInfo.interests.join(', ')}` : ''}
${personalInfo.expertise_areas?.length ? `\nExpertise Areas: ${personalInfo.expertise_areas.join(', ')}` : ''}

## Preferences
- Communication Style: ${personalInfo.communication_preferences?.tone || 'Not specified'}
- Learning Style: ${personalInfo.learning_style || 'Not specified'}
- Work Style: ${personalInfo.work_style || 'Not specified'}`;
      return {
        content: response,
        wasSearchPerformed: true
      };
    }

    // If asking about personal preferences/info and personalization is active, don't search
    if (isPersonalizationActive && 
        content.toLowerCase().match(/\b(my|about me|myself|i am|i'm|i like|i prefer|i want|i need)\b/) &&
        personalInfo?.personalization_document) {
      return {
        content,
        wasSearchPerformed: false
      };
    }

    // Check if we should search
    const shouldSearch = forceSearch || await shouldPerformSearch(content);
    
    if (!shouldSearch) {
      return {
        content,
        wasSearchPerformed: false
      };
    }

    console.log('Performing search for:', content);
    
    // Perform search with personalization context
    const searchResults = await searchService.search(content);
    const formattedResults = formatSearchResults(searchResults);
    
    console.log('Search completed with', searchResults.sources.length, 'sources');
    
    // Return the synthesized, Perplexity-style response
    return {
      content: formattedResults,
      wasSearchPerformed: true
    };
  } catch (error) {
    console.error('Search handling error:', error);
    // If search fails, return original content
    return {
      content,
      wasSearchPerformed: false
    };
  }
}