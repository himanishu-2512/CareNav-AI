// Red Flag Detection Module
// Scans patient data and reports for critical medical information

/**
 * Predefined red flag keywords as per requirements
 */
export const RED_FLAG_KEYWORDS = [
  'allergy',
  'allergic',
  'chronic',
  'diabetes',
  'hypertension',
  'heart disease',
  'asthma',
  'seizure',
  'pregnant',
  'breastfeeding'
] as const;

/**
 * Detect red flags in text content
 * Returns array of detected red flags with context
 */
export function detectRedFlags(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const lowerText = text.toLowerCase();
  const detectedFlags = new Set<string>();

  // Scan for each keyword
  for (const keyword of RED_FLAG_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      // Extract context around the keyword (up to 100 characters)
      const index = lowerText.indexOf(keyword);
      const start = Math.max(0, index - 50);
      const end = Math.min(text.length, index + keyword.length + 50);
      const context = text.substring(start, end).trim();
      
      // Add the detected flag with context
      detectedFlags.add(context);
    }
  }

  return Array.from(detectedFlags);
}

/**
 * Scan multiple text sources for red flags
 * Useful for scanning patient profile, symptoms, and reports together
 */
export function scanMultipleSources(sources: string[]): string[] {
  const allFlags = new Set<string>();

  for (const source of sources) {
    const flags = detectRedFlags(source);
    flags.forEach(flag => allFlags.add(flag));
  }

  return Array.from(allFlags);
}

/**
 * Check if text contains any red flag keywords
 */
export function hasRedFlags(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const lowerText = text.toLowerCase();
  return RED_FLAG_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Get red flag keywords that match in the text
 */
export function getMatchingKeywords(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const lowerText = text.toLowerCase();
  return RED_FLAG_KEYWORDS.filter(keyword => lowerText.includes(keyword));
}

/**
 * Highlight red flags in text by wrapping them with markers
 * Useful for frontend display
 */
export function highlightRedFlags(text: string, startMarker = '**', endMarker = '**'): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let highlightedText = text;

  // Sort keywords by length (longest first) to avoid partial matches
  const sortedKeywords = [...RED_FLAG_KEYWORDS].sort((a, b) => b.length - a.length);

  for (const keyword of sortedKeywords) {
    // Case-insensitive replacement while preserving original case
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
    highlightedText = highlightedText.replace(regex, `${startMarker}$1${endMarker}`);
  }

  return highlightedText;
}
