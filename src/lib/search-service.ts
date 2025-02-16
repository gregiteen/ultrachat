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
    const prompt = `You are an expert at crafting search queries. Rewrite this query to get the most comprehensive and accurate search results: "${query}"
    
Your rewrite should:
- Be clear and specific
- Include relevant technical terms
- Cover multiple aspects of the question
- Be optimized for search engines

Return ONLY the rewritten query with no explanation or additional text.`;

    const rewritten = await gemini.generateText(prompt);
    return rewritten.trim();
  }

  private async rankResults(results: SearchResult[]): Promise<SearchResult[]> {
    // Remove duplicates based on URL
    const uniqueResults = results.reduce((acc, current) => {
      const exists = acc.find(item => item.link === current.link);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as SearchResult[]);

    // Sort by relevance score
    return uniqueResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async generateSummary(query: string, results: SearchResult[]): Promise<string> {
    const sources = results.map(r => 
      `Source: ${r.title}\nURL: ${r.link}\nExcerpt: ${r.snippet}\n`
    ).join('\n');

    const prompt = `Based on these search results for "${query}", provide a comprehensive answer that:
- Synthesizes information from multiple sources
- Includes specific details and facts
- Maintains accuracy and nuance
- Uses clear, engaging language

Search Results:
${sources}

Return ONLY the summary with no additional text or source citations.`;

    return await gemini.generateText(prompt);
  }

  private async generateFollowUps(query: string, results: SearchResult[]): Promise<FollowUpQuestion[]> {
    const prompt = `Based on this search query and results, generate 3 follow-up questions that would help explore the topic further:

Original Query: "${query}"

Search Results:
${results.map(r => r.title).join('\n')}

For each question, specify its type:
- "clarification" for questions that clarify aspects of the original query
- "deeper" for questions that explore deeper implications
- "related" for questions about related topics

Format each question as a JSON object with "text" and "type" fields.
Return an array of these objects, nothing else.`;

    const response = await gemini.generateStructuredResponse(prompt);
    return response as FollowUpQuestion[];
  }

  public async search(query: string): Promise<SearchResponse> {
    // Step 1: Rewrite query for better results
    const rewrittenQuery = await this.rewriteQuery(query);
    console.log('Rewritten query:', rewrittenQuery);

    // Step 2: Get search results from both Brave and Google in parallel
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

    // Step 3: Combine and normalize results
    const results: SearchResult[] = [
      ...braveResults.map((result, index) => ({
        title: result.title,
        link: result.url,
        snippet: result.description,
        source: result.source || new URL(result.url).hostname,
        relevanceScore: result.relevance_score || (1 - (index * 0.05)) // Use provided score or decay function
      })),
      ...googleResults.map((result, index) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        source: result.pagemap?.metatags?.[0]?.['og:site_name'] || new URL(result.link).hostname,
        relevanceScore: 1 - ((index + braveResults.length) * 0.05) // Continue decay from brave results
      }))
    ];

    // Step 4: Rank and filter combined results
    const rankedResults = await this.rankResults(results);
    const topResults = rankedResults.slice(0, 5);

    // Step 5: Generate summary
    const summary = await this.generateSummary(query, topResults);

    // Step 6: Generate follow-up questions
    const followUps = await this.generateFollowUps(query, topResults);

    return {
      summary,
      sources: topResults,
      followUps
    };
  }
}

export const searchService = SearchService.getInstance();