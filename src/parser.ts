export const RE_KEYWORDS = /^\s*\d*\.?\s*Keyword Reference/i;
export const RE_EDGE = /^\s*\d*\.?\s*(Edge Case Guidance|Edge Cases)\b/i;
export const RE_NEXT_SECTION = /^\s*\d+\.\s+[A-Z].*$/m;
export const RE_TOPIC_LINE = /^[^\S\r\n]*[^:]+:\s+.+$/;

export function extractMainTopic(src: string): string {
  const lines = src.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}

export function extractSubTopics(src: string): string[] {
  const lines = src.split('\n');
  const topics: string[] = [];
  let inKeywordSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (RE_KEYWORDS.test(line)) {
      inKeywordSection = true;
      continue;
    }
    
    if (inKeywordSection) {
      if (RE_EDGE.test(line) || (RE_NEXT_SECTION.test(line) && !RE_KEYWORDS.test(line))) {
        break;
      }
      
      if (RE_TOPIC_LINE.test(line)) {
        const trimmed = line.trim();
        if (trimmed) {
          topics.push(trimmed);
        }
      }
    }
  }
  
  return topics;
}

export function extractEdgeCases(src: string): string[] {
  const lines = src.split('\n');
  const cases: string[] = [];
  let inEdgeSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (RE_EDGE.test(line)) {
      inEdgeSection = true;
      continue;
    }
    
    if (inEdgeSection) {
      if (RE_NEXT_SECTION.test(line) && !RE_EDGE.test(line)) {
        break;
      }
      
      const trimmed = line.trim();
      if (trimmed && !RE_EDGE.test(trimmed)) {
        cases.push(trimmed);
      }
    }
  }
  
  return cases;
}