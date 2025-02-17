import { gemini } from './gemini';
import { braveSearch } from './brave-search';
import { googleSearch } from './google-search';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  relevanceScore: number;
}

interface FollowUpQuestion {
  text: string;
  type: 'clarification' | 'deeper' | 'related';
}

interface SearchResponse {
  summary: string;
  sources: SearchResult[];
  followUps: FollowUpQuestion[];
}

class SearchService {
  private static instance: SearchService;

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  private async rewriteQuery(query: string): Promise<string> {
    try {
      console.log('Rewriting query:', query);
      const prompt = `You are an expert at crafting search queries. Rewrite this query to get the most comprehensive and accurate search results: "${query}"
    
Analyze the query to:
1. Identify the core information need
2. Extract key concepts and technical terms
3. Consider potential ambiguities or missing context
4. Think about related aspects that might be relevant

Then, rewrite the query to:
1. Be precise and unambiguous
2. Include essential technical terminology
3. Cover all relevant aspects
4. Use boolean operators (AND, OR) when helpful
5. Add context-specific qualifiers
6. Optimize for search engine relevance

Return ONLY the rewritten query with no explanation or additional text.
Example: "quantum computing" → "quantum computing fundamentals AND (applications OR use cases) AND current state of technology"`;

      const rewritten = await gemini.generateText(prompt);
      const result = rewritten.trim() || query;
      console.log('Query rewritten:', { original: query, rewritten: result });
      return result;
    } catch (error) {
      console.error('Query rewrite error:', error);
      return query; // Fallback to original query
    }
  }

  private async rankResults(results: SearchResult[]): Promise<SearchResult[]> {
    try {
      console.log('Ranking', results.length, 'results');
      // Remove duplicates based on URL
      const uniqueResults = Array.from(new Map(results.map(r => [r.link, r])).values());
      console.log('After deduplication:', uniqueResults.length, 'results');

      // Calculate domain authority scores (simple version)
      const domainScores = new Map<string, number>();
      uniqueResults.forEach(result => {
        const domain = new URL(result.link).hostname;
        // Prefer academic and well-known technical domains
        if (domain.endsWith('.edu')) domainScores.set(domain, 0.9);
        else if (domain.endsWith('.gov')) domainScores.set(domain, 0.85);
        else if (domain.endsWith('.org')) domainScores.set(domain, 0.8);
        else if (['github.com', 'stackoverflow.com', 'medium.com'].includes(domain)) {
          domainScores.set(domain, 0.75);
        } else {
          domainScores.set(domain, 0.6);
        }
      });

      // Enhance relevance scores with domain authority
      const enhancedResults = uniqueResults.map(result => {
        const domain = new URL(result.link).hostname;
        const domainScore = domainScores.get(domain) || 0.5;
        
        return {
          ...result,
          relevanceScore: result.relevanceScore * domainScore
        };
      });

      // Sort by enhanced relevance score
      const sortedResults = enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      console.log('Final ranked results:', sortedResults.length);
      return sortedResults;
    } catch (error) {
      console.error('Error ranking results:', error);
      return results; // Return original results if ranking fails
    }
  }

  private async generateSummary(query: string, results: SearchResult[]): Promise<string> {
    try {
      console.log('Generating summary for', results.length, 'results');
      const sources = results.map(r => 
        `Source: ${r.title}\nURL: ${r.link}\nExcerpt: ${r.snippet}\n`
      ).join('\n');

      const prompt = `Based on these search results for "${query}", provide a comprehensive answer that combines information from multiple sources. 

IMPORTANT REQUIREMENTS:
1. ALWAYS start with the CURRENT/LATEST information first
2. ALWAYS include explicit citations using [1], [2], etc. after EVERY fact
3. ALWAYS specify dates when available
4. ALWAYS include direct quotes when relevant
5. NEVER make statements without a citation

Your response should:

1. Start with a clear, direct answer to the main question
2. Include specific facts, figures, and dates with citations
3. Use inline citations for EVERY fact (e.g., "According to [1]...")
4. Quote directly from sources when relevant
5. Compare and contrast different viewpoints
6. End with sources list

Search Results:
${sources}

Format your response as:
1. Main answer with citations
2. Additional details with citations
3. Sources list
`;

      const summary = await gemini.generateText(prompt);
      console.log('Summary generated:', summary.length, 'characters');
      return summary || 'Unable to generate summary. Please review the sources below.';
    } catch (error) {
      console.error('Summary generation error:', error);
      return 'Unable to generate summary. Here are the relevant sources:\n\n' + 
             results.map(r => `- ${r.title} (${r.link})`).join('\n');
    }
  }

  private async generateFollowUps(query: string, results: SearchResult[]): Promise<FollowUpQuestion[]> {
    try {
      console.log('Generating follow-up questions');
      const prompt = `Based on this search query and results, generate 3 follow-up questions that would help explore the topic further:

Query: "${query}"

Context from Results:
${results.map(r => r.title).join('\n')}

Generate questions that:
1. Clarify ambiguous aspects of the original query
2. Explore deeper technical implications
3. Connect to related practical applications
4. Address potential misconceptions
5. Consider future developments or trends

Question types:
- "clarification": Resolve ambiguities or define terms
- "deeper": Explore technical details or implications
- "related": Connect to practical applications or related topics

Each question should be:
- Specific and focused
- Technically relevant
- Naturally flowing from the original query
- Designed to deepen understanding

Format each question as a JSON object with "text" and "type" fields.
Return an array of 3-5 question objects, nothing else.`;

      const response = await gemini.generateStructuredResponse(prompt);
      console.log('Generated', response.length, 'follow-up questions');
      return response as FollowUpQuestion[];
    } catch (error) {
      console.error('Follow-up questions generation error:', error);
      return [{
        text: 'Would you like more specific information about any of these sources?',
        type: 'clarification'
      }];
    }
  }

  public async search(query: string): Promise<SearchResponse> {
    try {
      console.log('Search Service:', { query, timestamp: new Date().toISOString() });
      
      // Step 1: Rewrite query
      const rewrittenQuery = await this.rewriteQuery(query);
      console.log('Search query:', { original: query, rewritten: rewrittenQuery });

      // Step 2: Parallel search requests
      console.log('Starting parallel search requests...');
      const [braveResults, googleResults] = await Promise.all([
        braveSearch.search(rewrittenQuery).catch(error => {
          console.error('Brave search error:', error);
          return [];
        }),
        googleSearch.search(rewrittenQuery).catch(error => {
          console.error('Google search error:', error);
          return [];
        })
      ]);

      console.log('Search provider results:', { 
        brave: braveResults.length, 
        google: googleResults.length 
      });

      // Step 3: Normalize and combine results
      const results: SearchResult[] = [
        ...braveResults.map((result, index) => ({
          title: result.title,
          link: result.url,
          snippet: result.description,
          source: result.source || new URL(result.url).hostname,
          relevanceScore: result.relevance_score || (1 - (index * 0.05))
        })),
        ...googleResults.map((result, index) => ({
          title: result.title,
          link: result.link,
          snippet: result.snippet,
          source: result.pagemap?.metatags?.[0]?.['og:site_name'] || new URL(result.link).hostname,
          relevanceScore: 1 - ((index + braveResults.length) * 0.05)
        }))
      ];

      console.log('Combined results:', { 
        total: results.length,
        fromBrave: braveResults.length,
        fromGoogle: googleResults.length
      });

      // Only throw if both search providers failed
      if (results.length === 0 && braveResults.length === 0 && googleResults.length === 0) {
        console.error('No results from either search provider');
        throw new Error('Search services unavailable. Please try again later.');
      }

      // Step 4: Enhanced ranking
      const rankedResults = await this.rankResults(results);
      const topResults = rankedResults.slice(0, 5);

      if (topResults.length === 0) {
        console.error('No relevant results after ranking');
        throw new Error('No relevant results found. Please try rephrasing your query.');
      }

      console.log('Final results:', { 
        total: results.length, 
        ranked: rankedResults.length, 
        selected: topResults.length 
      });

      // Step 5: Generate summary
      const summary = await this.generateSummary(query, topResults);

      // Step 6: Generate follow-up questions
      const followUps = await this.generateFollowUps(query, topResults);

      console.log('Search completed successfully');

      return {
        summary,
        sources: topResults,
        followUps: followUps.length > 0 ? followUps : [{
          text: 'Would you like more details about any of these results?',
          type: 'clarification'
        }]
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }
}

export const searchService = SearchService.getInstance();