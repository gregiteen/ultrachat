import { gemini } from './gemini';
import { braveSearch } from './brave-search';
import { googleSearch } from './google-search';
import { usePersonalizationStore } from '../store/personalization';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  domain_trust: number;
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
  source_previews: { [key: string]: string };
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

Return ONLY the rewritten query with no explanation or additional text.`;

      const rewritten = await gemini.generateText(prompt);
      const result = rewritten.trim() || query;
      console.log('Query rewritten:', { original: query, rewritten: result });
      return result;
    } catch (error) {
      console.error('Query rewrite error:', error);
      return query; // Fallback to original query
    }
  }

  private calculateDomainTrust(domain: string): number {
    let trustScore = 0.6; // Base score

    // Academic and educational
    if (domain.endsWith('.edu')) trustScore = 0.95;
    // Government
    else if (domain.endsWith('.gov')) trustScore = 0.9;
    // Non-profit organizations
    else if (domain.endsWith('.org')) trustScore = 0.85;
    // Well-known tech sites
    else if ([
      'github.com',
      'stackoverflow.com',
      'developer.mozilla.org',
      'w3.org'
    ].includes(domain)) trustScore = 0.9;
    // Major news and reference
    else if ([
      'wikipedia.org',
      'reuters.com',
      'nature.com',
      'sciencedirect.com'
    ].includes(domain)) trustScore = 0.88;
    // Tech blogs and documentation
    else if ([
      'medium.com',
      'dev.to',
      'docs.microsoft.com',
      'developers.google.com'
    ].includes(domain)) trustScore = 0.82;

    return trustScore;
  }

  private async rankResults(results: SearchResult[]): Promise<{ results: SearchResult[], previews: { [key: string]: string } }> {
    try {
      console.log('Ranking', results.length, 'results');
      
      // Remove duplicates based on URL
      const uniqueResults = Array.from(new Map(results.map(r => [r.link, r])).values());
      console.log('After deduplication:', uniqueResults.length, 'results');

      // Generate source previews and calculate trust scores
      const sourcePreviews = new Map<string, string>();
      const enhancedResults = uniqueResults.map(result => {
        const domain = new URL(result.link).hostname;
        const trustScore = this.calculateDomainTrust(domain);
        
        if (!sourcePreviews.has(domain)) {
          sourcePreviews.set(domain, `${result.title} - ${result.snippet.slice(0, 150)}...`);
        }

        return {
          ...result,
          domain_trust: trustScore,
          relevanceScore: result.relevanceScore * trustScore
        };
      });

      // Sort by enhanced relevance score
      const sortedResults = enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      console.log('Final ranked results:', sortedResults.length);

      return {
        results: sortedResults,
        previews: Object.fromEntries(sourcePreviews)
      };
    } catch (error) {
      console.error('Error ranking results:', error);
      return { results, previews: {} };
    }
  }

  private async generateSummary(query: string, results: SearchResult[], includePersonalization: boolean = true): Promise<string> {
    try {
      console.log('Generating summary for', results.length, 'results');
      const sources = results.map(r => {
        const domain = new URL(r.link).hostname;
        return `Source: ${r.title} (Trust Score: ${r.domain_trust.toFixed(2)})
URL: ${r.link}
Domain: ${domain}\n
Excerpt: ${r.snippet}`;
      }).join('\n');

      // Get personalization context if active
      let personalizationContext = '';
      if (includePersonalization) {
        const { isActive, personalInfo } = usePersonalizationStore.getState();
        if (isActive && personalInfo) {
          personalizationContext = `
User Context:
- Name: ${personalInfo.name || 'Not specified'}
- Interests: ${personalInfo.interests?.join(', ') || 'Not specified'}
- Expertise: ${personalInfo.expertise_areas?.join(', ') || 'Not specified'}
- Communication Style: ${personalInfo.communication_preferences?.tone || 'Not specified'}
- Learning Style: ${personalInfo.learning_style || 'Not specified'}

Please tailor the response to match this user's background and preferences while maintaining accuracy and comprehensiveness.
`;
        }
      }

      const prompt = `Based on these search results for "${query}", provide a beautifully formatted markdown response that reads like an expert explanation.

IMPORTANT REQUIREMENTS:
1. Format the response in clean, readable markdown
2. Use proper heading levels (# for main, ## for sub)
3. Format citations in small text using <small> tags
4. Use bullet points and numbered lists appropriately
5. Include relevant code blocks with proper syntax highlighting
6. Add horizontal rules (---) between major sections

Citations should be formatted like this:
<small>Source: domain.com</small>

Content Requirements:
Your response should:
1. Begin with a clear, direct answer
2. Integrate citations naturally using domain names
3. Quote directly from highly trusted sources
4. Compare different viewpoints when available
5. End with a strong conclusion

Search Results:
${sources}

${personalizationContext}

Remember: 
- Keep thinking separate using <thinking> tags
- Make the response beautiful and easy to read with proper markdown formatting`;

      const summary = await gemini.generateText(prompt);
      console.log('Summary generated:', summary.length, 'characters');
      return summary || 'Unable to generate summary. Please review the sources below.';
    } catch (error) {
      console.error('Summary generation error:', error);
      return 'Unable to generate summary due to an error.';
    }
  }

  private async generateFollowUps(query: string, results: SearchResult[], includePersonalization: boolean = true): Promise<FollowUpQuestion[]> {
    try {
      console.log('Generating follow-up questions');
      const prompt = `Based on this search query and results, generate 3 follow-up questions that would help explore the topic further:

Original Query: "${query}"

Search Context:
${results.map(r => r.title).join('\n')}

${(() => {
  if (includePersonalization) {
    const { isActive, personalInfo } = usePersonalizationStore.getState();
    if (isActive && personalInfo) {
      return `User Interests: ${personalInfo.interests?.join(', ') || 'Not specified'}
User Expertise: ${personalInfo.expertise_areas?.join(', ') || 'Not specified'}

Consider the user's interests and expertise level when generating questions.`;
    }
  }
  return '';
})()}

Requirements:
1. Make questions clear and specific
2. Ensure they flow naturally from the content
3. Cover different aspects of the topic
4. Make them interesting and engaging
5. Keep them concise and clickable

Types:
- "clarification": Clarify concepts
- "deeper": Dive deeper into details
- "related": Connect to applications

Format each question as a JSON object with "text" and "type" fields.
Return an array of 3 question objects, nothing else.`;

      const response = await gemini.generateStructuredResponse(prompt);
      console.log('Generated follow-up questions');
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
          console.error('Brave Search error:', error);
          return [];
        }),
        googleSearch.search(rewrittenQuery).catch(error => {
          console.error('Google search error:', error);
          return [];
        })
      ]);

      console.log('Search results by provider:', { 
        'Brave Search': braveResults.length, 
        'Google Search': googleResults.length,
        'Total Raw': braveResults.length + googleResults.length
      });

      // Step 3: Normalize and combine results
      const results: SearchResult[] = [
        ...braveResults.map((result, index) => ({
          title: result.title,
          link: result.url,
          snippet: result.description,
          domain_trust: 0.6, // Initial score, will be updated during ranking
          source: result.source || new URL(result.url).hostname,
          relevanceScore: result.relevance_score || (1 - (index * 0.05))
        })),
        ...googleResults.map((result, index) => ({
          title: result.title,
          link: result.link,
          snippet: result.snippet,
          domain_trust: 0.6, // Initial score, will be updated during ranking
          source: result.pagemap?.metatags?.[0]?.['og:site_name'] || new URL(result.link).hostname,
          relevanceScore: 1 - ((index + braveResults.length) * 0.05)
        }))
      ];

      console.log('Combined results:', { 
        total: results.length,
        'From Brave': braveResults.length,
        'From Google': googleResults.length,
        'After Deduplication': new Set(results.map(r => r.link)).size
      });

      if (results.length === 0) {
        throw new Error('No search results found. Please try rephrasing your query.');
      }

      // Step 4: Enhanced ranking
      const { results: rankedResults, previews: sourcePreviews } = await this.rankResults(results.filter(r => r.snippet && r.title));
      const topResults = rankedResults.slice(0, 5);

      if (topResults.length === 0) {
        throw new Error('No relevant results found. Please try rephrasing your query.');
      }

      // Step 5: Generate summary
      const { isActive } = usePersonalizationStore.getState();
      const includePersonalization = isActive;

      const summary = await this.generateSummary(query, topResults, includePersonalization);

      // Step 6: Generate follow-up questions
      const followUps = await this.generateFollowUps(query, topResults, includePersonalization);

      console.log('Search completed successfully');

      return {
        summary,
        sources: topResults,
        source_previews: sourcePreviews,
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