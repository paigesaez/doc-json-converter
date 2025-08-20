export const RE_KEYWORDS = /^\s*\d*\.?\s*Keyword Reference/i;
export const RE_EDGE = /^\s*\d*\.?\s*(Edge Case Guidance|Edge Cases)\b/i;
export const RE_NEXT_SECTION = /^\s*\d+\.\s+[A-Z].*$/m;
export const RE_TOPIC_LINE = /^[^\S\r\n]*[^:]+:\s+.+$/;
export const RE_SECTION_HEADER = /^(High-Signal Keywords|Keywords & Phrases|High-Signal Keywords & Phrases):/i;

export function extractMainTopic(src: string): string {
  const lines = src.split('\n');
  
  // First look for a title that ends with "Labeling Instructions"
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes('Labeling Instructions')) {
      // Extract everything before "Labeling Instructions"
      const topic = trimmed.replace(/\s*Labeling Instructions\s*/gi, '').trim();
      if (topic) {
        return topic;
      }
    }
  }
  
  // Look for explicit "Topic:" label
  for (const line of lines) {
    if (line.toLowerCase().includes('topic:')) {
      const match = line.match(/topic:\s*(.+)/i);
      if (match) {
        return match[1].trim().replace(/\s*Labeling Instructions\s*/gi, '').trim();
      }
    }
  }
  
  // Otherwise look for the first non-empty, non-section line
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && 
        !RE_EDGE.test(trimmed) && 
        !RE_KEYWORDS.test(trimmed) &&
        !RE_NEXT_SECTION.test(trimmed) &&
        !trimmed.toLowerCase().startsWith('here') &&
        !trimmed.toLowerCase().includes('breakdown')) {
      if (!trimmed.startsWith('"') && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
        if (!RE_TOPIC_LINE.test(trimmed)) {
          return trimmed.replace(/\s*Labeling Instructions\s*/gi, '').trim();
        }
      }
    }
  }
  return '';
}

export function extractSubTopics(src: string): string[] {
  const lines = src.split('\n');
  const topics: string[] = [];
  let inKeywordSection = false;
  
  // Look for section 3 (Keyword Reference)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check for section 3 or Keyword Reference header
    if (/^3\.\s*(Keyword Reference)/i.test(trimmed) || 
        /^(keyword reference|keywords)/i.test(trimmed)) {
      inKeywordSection = true;
      continue;
    }
    
    // Stop at section 4 or later
    if (inKeywordSection && /^[4-9]\.\s+/i.test(trimmed)) {
      break;
    }
    
    // Also stop if we hit "Labeling Examples" (section 4 alternative title)
    if (inKeywordSection && /labeling examples/i.test(trimmed)) {
      break;
    }
    
    // If we're in keyword section, extract items
    if (inKeywordSection) {
      let cleaned = trimmed;
      
      // Skip header lines, tips, notes, and standalone descriptive text
      if (/^(high-signal|keywords|phrases|these are|use these|purpose:|tip:|note:|clarifying)/i.test(cleaned)) {
        continue;
      }
      
      // Skip lines that start with emoji indicators like 🛈
      if (/^[🛈ℹ️📝💡⚠️]/u.test(cleaned)) {
        continue;
      }
      
      // Check for lettered subsections (A. B. C. D. E. F. etc) - these are headers, skip them
      const letterMatch = cleaned.match(/^[A-F]\.\s+(.+)/);
      if (letterMatch) {
        // Skip the header itself, we want the Keywords: line that follows
        continue;
      }
      
      // Remove bullets and numbering
      cleaned = cleaned.replace(/^[•*\-–—]\s*/, '');
      cleaned = cleaned.replace(/^\d+[.)]\s*/, '');
      
      // Skip empty lines and dividers
      if (!cleaned || cleaned === '⸻' || /^[-=_]{3,}$/.test(cleaned)) {
        continue;
      }
      
      // Look for "Keywords:" lines specifically - these have the actual content
      if (cleaned.startsWith('Keywords:')) {
        const keywordContent = cleaned.substring('Keywords:'.length).trim();
        if (keywordContent) {
          topics.push('Keywords: ' + keywordContent);
        }
        continue;
      }
      
      // Also add other category lines with colons (for older format)
      if (cleaned.length > 2 && cleaned.includes(':') && !cleaned.startsWith('Purpose:')) {
        topics.push(cleaned);
      }
    }
  }
  
  // If no subtopics found yet, look for label:value patterns anywhere
  if (topics.length === 0) {
    for (const line of lines) {
      let trimmed = line.trim();
      
      // Remove bullet points if present
      if (trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('-')) {
        trimmed = trimmed.replace(/^[•*-]\s*/, '').trim();
      }
      
      // Skip section headers
      if (!RE_EDGE.test(trimmed) && 
          !RE_KEYWORDS.test(trimmed) && 
          !RE_NEXT_SECTION.test(trimmed) &&
          !RE_SECTION_HEADER.test(trimmed)) {
        if (RE_TOPIC_LINE.test(trimmed)) {
          // Extract the actual topic line if it's quoted
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            topics.push(trimmed.slice(1, -1));
          } else {
            topics.push(trimmed);
          }
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
  
  // Look for section 5 or edge case section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check for section 5 or edge case header
    if (/^5\.\s*(Edge Case|Edge Cases)/i.test(trimmed) || 
        /^(edge cases|edge case guidance)/i.test(trimmed)) {
      inEdgeSection = true;
      continue;
    }
    
    // Stop at section 6 or 7
    if (inEdgeSection && /^[67]\.\s+/i.test(trimmed)) {
      break;
    }
    
    // If we're in edge cases section
    if (inEdgeSection) {
      let cleaned = trimmed;
      
      // Remove bullets, numbering, and emoji indicators
      cleaned = cleaned.replace(/^[•*\-–—✅🚫⚠️]\s*/, '');
      cleaned = cleaned.replace(/^\d+[.)]\s*/, '');
      
      // Skip empty lines and dividers
      if (!cleaned || cleaned === '⸻' || /^[-=_]{3,}$/.test(cleaned)) {
        continue;
      }
      
      // Skip section 6 content (Common Pitfalls)
      if (/^(common pitfalls|escalation protocol)/i.test(cleaned)) {
        break;
      }
      
      // Add non-empty lines
      if (cleaned.length > 2) {
        cases.push(cleaned);
      }
    }
  }
  
  // If no edge section found, look for quoted strings or bullet points
  if (cases.length === 0) {
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip section headers and topic patterns
      if (!RE_EDGE.test(trimmed) && !RE_KEYWORDS.test(trimmed) && !RE_TOPIC_LINE.test(trimmed)) {
        // Look for quoted strings or lines starting with bullets
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
            trimmed.startsWith('-') || 
            trimmed.startsWith('•') ||
            trimmed.startsWith('*')) {
          // Remove leading bullets if present
          const cleaned = trimmed.replace(/^[-•*]\s*/, '');
          if (cleaned) {
            cases.push(cleaned);
          }
        }
      }
    }
  }
  
  return cases;
}