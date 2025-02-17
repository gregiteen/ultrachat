import type { SearchResponse } from '../types';

export function formatSearchResults(results: SearchResponse): string {
  // Extract date if available in the first few sources
  const dateMatch = results.sources.slice(0, 3).map(s => s.snippet).join(' ')
    .match(/\b(202\d|today|yesterday|\d{1,2}\s+(?:hours?|minutes?|days?)\s+ago)\b/i);
  const dateInfo = dateMatch ? `(As of ${dateMatch[0]})` : '';

  return `# Search Results ${dateInfo}

${results.summary}

## Sources
${results.sources.map((source, i) => (
  `[${i + 1}] ${source.title}
     URL: ${source.link}
     ${source.snippet.trim().split('\n').map(line => `     ${line}`).join('\n')}`
)).join('\n\n')}

## Follow-up Questions
${results.followUps.map((q, i) => {
  const icon = q.type === 'clarification' ? '🔍' : 
               q.type === 'deeper' ? '🔬' : 
               '🔗';
  return `${icon} ${q.text}`;
}).join('\n')}

Note: All information is sourced from the citations above. Let me know if you'd like me to:
1. Explore any follow-up questions
2. Provide more details from a specific source
3. Search for more recent information`;
}