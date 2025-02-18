import type { SearchResponse, SearchSource, FollowUpQuestion } from '../types';

export function formatSearchResults(results: SearchResponse): string {
  // Return only the synthesized summary, which already includes natural citations
  // and is formatted in a Perplexity-style flowing narrative
  return results.summary;
}