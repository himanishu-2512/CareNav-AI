/**
 * Disease Name Filter
 * 
 * This module provides functionality to scan question text for disease names
 * and filter them out to ensure patient privacy. Questions containing disease
 * names should never be shown to patients.
 * 
 * Requirements: 3.6, 4.1, 4.2
 */

import { TargetedQuestion, DiseaseCandidate } from './types';

/**
 * Result of filtering questions for disease names
 */
export interface FilterResult {
  cleanQuestions: TargetedQuestion[];
  flaggedQuestions: TargetedQuestion[];
  totalFiltered: number;
}

/**
 * Filters questions to remove any that contain disease names
 * 
 * @param questions - Array of questions to filter
 * @param diseases - Array of disease candidates to check against
 * @returns FilterResult with clean questions and flagged questions
 * 
 * @example
 * const result = filterDiseaseNames(questions, diseases);
 * // Use result.cleanQuestions for patient display
 * // Log result.flaggedQuestions for debugging
 */
export function filterDiseaseNames(
  questions: TargetedQuestion[],
  diseases: DiseaseCandidate[]
): FilterResult {
  if (!questions || questions.length === 0) {
    return {
      cleanQuestions: [],
      flaggedQuestions: [],
      totalFiltered: 0
    };
  }

  if (!diseases || diseases.length === 0) {
    return {
      cleanQuestions: questions,
      flaggedQuestions: [],
      totalFiltered: 0
    };
  }

  // Extract all disease names and normalize to lowercase for case-insensitive matching
  const diseaseNames = diseases.map(d => d.diseaseName.toLowerCase());

  const cleanQuestions: TargetedQuestion[] = [];
  const flaggedQuestions: TargetedQuestion[] = [];

  for (const question of questions) {
    if (containsDiseaseNames(question.questionText, diseaseNames)) {
      flaggedQuestions.push(question);
    } else {
      cleanQuestions.push(question);
    }
  }

  return {
    cleanQuestions,
    flaggedQuestions,
    totalFiltered: flaggedQuestions.length
  };
}

/**
 * Checks if text contains any disease names (case-insensitive)
 * 
 * @param text - Text to check
 * @param diseaseNames - Array of disease names (should be lowercase)
 * @returns true if text contains any disease name
 * 
 * @example
 * containsDiseaseNames("Do you have chest pain?", ["angina", "heart attack"]) // false
 * containsDiseaseNames("Is your angina worse?", ["angina", "heart attack"]) // true
 */
export function containsDiseaseNames(text: string, diseaseNames: string[]): boolean {
  if (!text || !diseaseNames || diseaseNames.length === 0) {
    return false;
  }

  const normalizedText = text.toLowerCase();

  // Check for exact word matches to avoid false positives
  // For example, "pain" should not match "Spain"
  for (const diseaseName of diseaseNames) {
    // Create word boundary regex for each disease name
    // This handles multi-word disease names like "Myocardial Infarction"
    const words = diseaseName.split(/\s+/);
    
    for (const word of words) {
      if (word.length === 0) continue;
      
      // Use word boundaries to match whole words only
      const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
      
      if (regex.test(normalizedText)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates that questions array contains no disease names
 * Throws an error if any disease names are found
 * 
 * @param questions - Questions to validate
 * @param diseases - Disease candidates to check against
 * @throws Error if any questions contain disease names
 * 
 * @example
 * validateNoDiseaseNames(questions, diseases); // throws if disease names found
 */
export function validateNoDiseaseNames(
  questions: TargetedQuestion[],
  diseases: DiseaseCandidate[]
): void {
  const result = filterDiseaseNames(questions, diseases);
  
  if (result.totalFiltered > 0) {
    const flaggedTexts = result.flaggedQuestions.map(q => q.questionText);
    throw new Error(
      `Questions contain disease names and cannot be shown to patients. ` +
      `Flagged questions: ${JSON.stringify(flaggedTexts)}`
    );
  }
}

/**
 * Escapes special regex characters in a string
 * 
 * @param str - String to escape
 * @returns Escaped string safe for use in RegExp
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts disease names from an array of disease candidates
 * 
 * @param diseases - Array of disease candidates
 * @returns Array of disease names (lowercase)
 */
export function extractDiseaseNames(diseases: DiseaseCandidate[]): string[] {
  if (!diseases || diseases.length === 0) {
    return [];
  }
  
  return diseases.map(d => d.diseaseName.toLowerCase());
}
