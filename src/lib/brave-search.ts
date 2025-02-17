interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  published_date?: string;
  source?: string;
  relevance_score?: number;
}

interface BraveSearchResponse {
  web: {
    results: BraveSearchResult[];
    total: number;
  };
}

class BraveSearchService {
  private static instance: BraveSearchService;
  private apiKey: string;

  private constructor() {
    this.apiKey = import.meta.env.VITE_BRAVE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Brave Search API key not found');
    }
  }

  public static getInstance(): BraveSearchService {
    if (!BraveSearchService.instance) {
      BraveSearchService.instance = new BraveSearchService();
    }
    return BraveSearchService.instance;
  }

  async search(query: string, count: number = 10): Promise<BraveSearchResult[]> {
    try {
      if (!this.apiKey) {
        throw new Error('Brave Search API key not configured. Please add VITE_BRAVE_API_KEY to your environment variables.');
      }

      const baseUrl = import.meta.env.DEV ? '/api/brave' : 'https://api.search.brave.com/res/v1';
      console.log('Brave Search:', { baseUrl, query, count });

      const response = await fetch(`${baseUrl}/web/search?q=${encodeURIComponent(query)}&count=${count}&text_decorations=false&text_format=raw`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Subscription-Token': this.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Brave API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Search failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: BraveSearchResponse = await response.json();
      console.log('Brave Search results:', data.web.results.length, 'items found');
      
      // Process and enhance results
      const enhancedResults = data.web.results.map((result, index) => ({
        ...result,
        source: new URL(result.url).hostname,
        relevance_score: 1 - (index * 0.1) // Simple decay function for relevance
      }));
      return enhancedResults;
    } catch (error) {
      console.error('Brave search error:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(
          'Unable to connect to search service. This might be due to CORS restrictions or network issues. ' +
          'Please ensure you have the correct API key and endpoint configuration.'
        );
      } else {
        throw new Error(
          'Search service error: ' + (error instanceof Error ? error.message : 'Unknown error')
        );
      }
    }
  }

  async searchWithSummary(query: string): Promise<string> {
    const results = await this.search(query, 5);
    let summary = `Search Results for "${query}":\n\n`;
    
    results.forEach((result, index) => {
      summary += `${index + 1}. ${result.title}\n`;
      if (result.published_date) {
        summary += `   Published: ${result.published_date}\n`;
      }
      summary += `   ${result.description}\n`;
      summary += `   URL: ${result.url}\n\n`;
    });

    return summary;
  }
}

export const braveSearch = BraveSearchService.getInstance();