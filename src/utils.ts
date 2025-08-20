export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function prettyJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

export function cleanLineItem(line: string): string {
  let cleaned = line.trim();
  
  // Remove common bullet points
  cleaned = cleaned.replace(/^[•*\-–—]\s*/, '');
  
  // Remove surrounding quotes if present
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  
  // Remove numbering like "1." or "1)"
  cleaned = cleaned.replace(/^\d+[.)]\s*/, '');
  
  return cleaned.trim();
}

export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function nowIso(): string {
  return new Date().toISOString();
}