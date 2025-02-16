interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    metatags?: Array<{
      'og:site_name'?: string;
    }>;
  };
}

interface GoogleSearchResponse {
  items: GoogleSearchResult[];
}

class GoogleSearchService {
  private static instance: GoogleSearchService;
  private apiKey: string;
  private searchEngineId: string;

  private constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
    this.searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID || '';
    
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('Google Search API configuration not found');
    }
  }

  public static getInstance(): GoogleSearchService {
    if (!GoogleSearchService.instance) {
      GoogleSearchService.instance = new GoogleSearchService();
    }
    return GoogleSearchService.instance;
  }

  async search(query: string, count: number = 10): Promise<GoogleSearchResult[]> {
    try {
      if (!this.apiKey || !this.searchEngineId) {
        throw new Error('Google Search API not configured. Please add VITE_GOOGLE_API_KEY and VITE_GOOGLE_SEARCH_ENGINE_ID to your environment variables.');
      }

      const baseUrl = import.meta.env.DEV ? '/api/google' : 'https://www.googleapis.com/customsearch/v1';
      console.log('Using Google search endpoint:', baseUrl);

      const response = await fetch(
        `${baseUrl}?key=${this.apiKey}&cx=${this.searchEngineId}&q=${encodeURIComponent(query)}&num=${count}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Search failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: GoogleSearchResponse = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Google search error:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(
          'Unable to connect to Google search service. This might be due to CORS restrictions or network issues. ' +
          'Please ensure you have the correct API key and endpoint configuration.'
        );
      } else {
        throw new Error(
          'Google search service error: ' + (error instanceof Error ? error.message : 'Unknown error')
        );
      }
    }
  }
}

export const googleSearch = GoogleSearchService.getInstance();