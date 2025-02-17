interface YouTubeTrack {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
  videoId: string;
}

interface SearchResult {
  tracks: YouTubeTrack[];
  nextPageToken?: string;
}

class YouTubeMusicService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('YouTube API key not found. YouTube Music features will be limited.');
    }
  }

  async search(query: string, pageToken?: string): Promise<SearchResult> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const params = new URLSearchParams({
      part: 'snippet',
      maxResults: '25',
      q: `${query} music`,
      type: 'video',
      videoCategoryId: '10', // Music category
      key: this.apiKey,
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    const response = await fetch(`${this.baseUrl}/search?${params}`);
    if (!response.ok) {
      throw new Error('Failed to search YouTube Music');
    }

    const data = await response.json();
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');

    // Get video details for duration
    const detailsParams = new URLSearchParams({
      part: 'contentDetails',
      id: videoIds,
      key: this.apiKey,
    });

    const detailsResponse = await fetch(`${this.baseUrl}/videos?${detailsParams}`);
    if (!detailsResponse.ok) {
      throw new Error('Failed to get video details');
    }

    const detailsData = await detailsResponse.json();
    const durationMap = new Map(
      detailsData.items.map((item: any) => [
        item.id,
        this.parseDuration(item.contentDetails.duration),
      ])
    );

    const tracks: YouTubeTrack[] = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      artwork: item.snippet.thumbnails.high.url,
      duration: durationMap.get(item.id.videoId) || 0,
      videoId: item.id.videoId,
    }));

    return {
      tracks,
      nextPageToken: data.nextPageToken,
    };
  }

  async getStreamUrl(videoId: string): Promise<string> {
    // In a real implementation, you would use a server-side proxy or a YouTube streaming service
    // This is a simplified example that returns a direct video URL
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const [, hours, minutes, seconds] = match;
    let total = 0;

    if (hours) total += parseInt(hours, 10) * 3600;
    if (minutes) total += parseInt(minutes, 10) * 60;
    if (seconds) total += parseInt(seconds, 10);

    return total;
  }

  async getRecommendations(videoId: string): Promise<YouTubeTrack[]> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const params = new URLSearchParams({
      part: 'snippet',
      maxResults: '10',
      relatedToVideoId: videoId,
      type: 'video',
      key: this.apiKey,
    });

    const response = await fetch(`${this.baseUrl}/search?${params}`);
    if (!response.ok) {
      throw new Error('Failed to get recommendations');
    }

    const data = await response.json();
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');

    // Get video details for duration
    const detailsParams = new URLSearchParams({
      part: 'contentDetails',
      id: videoIds,
      key: this.apiKey,
    });

    const detailsResponse = await fetch(`${this.baseUrl}/videos?${detailsParams}`);
    if (!detailsResponse.ok) {
      throw new Error('Failed to get video details');
    }

    const detailsData = await detailsResponse.json();
    const durationMap = new Map(
      detailsData.items.map((item: any) => [
        item.id,
        this.parseDuration(item.contentDetails.duration),
      ])
    );

    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      artwork: item.snippet.thumbnails.high.url,
      duration: durationMap.get(item.id.videoId) || 0,
      videoId: item.id.videoId,
    }));
  }
}

export const youtubeMusic = new YouTubeMusicService();