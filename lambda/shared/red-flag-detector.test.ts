// Red Flag Detector Tests
import {
  detectRedFlags,
  scanMultipleSources,
  hasRedFlags,
  getMatchingKeywords,
  highlightRedFlags,
  RED_FLAG_KEYWORDS
} from './red-flag-detector';

describe('Red Flag Detector', () => {
  describe('detectRedFlags', () => {
    it('should detect single red flag keyword', () => {
      const text = 'Patient has a known allergy to penicillin';
      const flags = detectRedFlags(text);
      
      expect(flags.length).toBeGreaterThan(0);
      expect(flags[0]).toContain('allergy');
    });

    it('should detect multiple red flag keywords', () => {
      const text = 'Patient has diabetes and hypertension with chronic pain';
      const flags = detectRedFlags(text);
      
      expect(flags.length).toBeGreaterThan(0);
    });

    it('should return empty array for text without red flags', () => {
      const text = 'Patient has a headache and fever';
      const flags = detectRedFlags(text);
      
      expect(flags).toEqual([]);
    });

    it('should handle empty string', () => {
      const flags = detectRedFlags('');
      expect(flags).toEqual([]);
    });

    it('should be case-insensitive', () => {
      const text = 'Patient has DIABETES and Hypertension';
      const flags = detectRedFlags(text);
      
      expect(flags.length).toBeGreaterThan(0);
    });
  });

  describe('scanMultipleSources', () => {
    it('should scan multiple text sources', () => {
      const sources = [
        'Patient has diabetes',
        'Known allergy to aspirin',
        'Chronic back pain'
      ];
      const flags = scanMultipleSources(sources);
      
      expect(flags.length).toBeGreaterThan(0);
    });

    it('should return unique flags', () => {
      const sources = [
        'Patient has diabetes',
        'Patient has diabetes and hypertension',
        'Diabetes management plan'
      ];
      const flags = scanMultipleSources(sources);
      
      // Should have unique flags, not duplicates
      const uniqueFlags = new Set(flags);
      expect(flags.length).toBe(uniqueFlags.size);
    });

    it('should handle empty sources array', () => {
      const flags = scanMultipleSources([]);
      expect(flags).toEqual([]);
    });
  });

  describe('hasRedFlags', () => {
    it('should return true when red flags present', () => {
      const text = 'Patient has diabetes';
      expect(hasRedFlags(text)).toBe(true);
    });

    it('should return false when no red flags present', () => {
      const text = 'Patient has a headache';
      expect(hasRedFlags(text)).toBe(false);
    });

    it('should handle empty string', () => {
      expect(hasRedFlags('')).toBe(false);
    });
  });

  describe('getMatchingKeywords', () => {
    it('should return matching keywords', () => {
      const text = 'Patient has diabetes and hypertension';
      const keywords = getMatchingKeywords(text);
      
      expect(keywords).toContain('diabetes');
      expect(keywords).toContain('hypertension');
    });

    it('should return empty array when no matches', () => {
      const text = 'Patient has a headache';
      const keywords = getMatchingKeywords(text);
      
      expect(keywords).toEqual([]);
    });

    it('should detect compound keywords', () => {
      const text = 'Patient has heart disease';
      const keywords = getMatchingKeywords(text);
      
      expect(keywords).toContain('heart disease');
    });
  });

  describe('highlightRedFlags', () => {
    it('should wrap keywords with default markers', () => {
      const text = 'Patient has diabetes';
      const highlighted = highlightRedFlags(text);
      
      expect(highlighted).toContain('**diabetes**');
    });

    it('should use custom markers', () => {
      const text = 'Patient has diabetes';
      const highlighted = highlightRedFlags(text, '<mark>', '</mark>');
      
      expect(highlighted).toContain('<mark>diabetes</mark>');
    });

    it('should preserve original case', () => {
      const text = 'Patient has DIABETES';
      const highlighted = highlightRedFlags(text);
      
      expect(highlighted).toContain('**DIABETES**');
    });

    it('should handle multiple keywords', () => {
      const text = 'Patient has diabetes and hypertension';
      const highlighted = highlightRedFlags(text);
      
      expect(highlighted).toContain('**diabetes**');
      expect(highlighted).toContain('**hypertension**');
    });

    it('should not modify text without red flags', () => {
      const text = 'Patient has a headache';
      const highlighted = highlightRedFlags(text);
      
      expect(highlighted).toBe(text);
    });
  });

  describe('RED_FLAG_KEYWORDS', () => {
    it('should contain all required keywords', () => {
      const requiredKeywords = [
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
      ];

      requiredKeywords.forEach(keyword => {
        expect(RED_FLAG_KEYWORDS).toContain(keyword);
      });
    });

    it('should have exactly 10 keywords', () => {
      expect(RED_FLAG_KEYWORDS.length).toBe(10);
    });
  });
});
