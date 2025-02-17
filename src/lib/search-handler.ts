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
    
    // If asking about personal info and personalization is active, don't search
    if (isPersonalizationActive && 
        content.toLowerCase().includes('who am i') && 
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
    
    // Perform search and format results with personalization context
    const searchResults = await searchService.search(content);
    const formattedResults = formatSearchResults(searchResults);
    
    console.log('Search completed with', searchResults.sources.length, 'sources');
    
    // Combine original content with search results
    return {
      content: `${content}\n\n${formattedResults}`,
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