// Recovery Recommender Module
// Generates AI-powered daily life modifications and recovery tips based on diagnosis
// Requirements: 18.1, 18.2, 18.3, 19.1, 19.2, 19.3, 19.4, 19.5

import { callGeminiJson } from './gemini-client';

/**
 * Difficulty level for implementing daily life modifications
 */
export type ModificationDifficulty = 'easy' | 'moderate' | 'challenging';

/**
 * Represents a single daily life modification recommendation
 */
export interface DailyLifeModification {
  modification: string;
  category: 'sleep' | 'stress_management' | 'physical_activity' | 'other';
  specificGuidance: string;
  expectedImpact: 'high' | 'medium' | 'low';
  difficulty: ModificationDifficulty;
}

/**
 * Category types for recovery tips
 */
export type RecoveryTipCategory = 'warning_signs' | 'timeline' | 'monitoring' | 'follow_up';

/**
 * Represents a single recovery tip
 */
export interface RecoveryTip {
  tip: string;
  category: RecoveryTipCategory;
  description: string;
}

/**
 * Complete recovery recommendations structure
 */
export interface RecoveryRecommendations {
  dailyLifeModifications: DailyLifeModification[];
  recoveryTips: RecoveryTip[];
}

/**
 * Input parameters for generating recovery recommendations
 */
export interface RecoveryRecommendationInput {
  diagnosis: string;
  patientAge: number;
  patientGender: string;
}

/**
 * Generate personalized recovery recommendations using AI
 * 
 * @param input - Patient information and diagnosis
 * @returns Structured recovery recommendations with daily life modifications and recovery tips
 * 
 * Requirements:
 * - 18.1: Generate daily life modification recommendations based on diagnosed disease
 * - 18.2: Include sleep schedule adjustments, stress management techniques, and physical activity guidelines
 * - 18.3: Provide specific, measurable guidance for each modification
 * - 19.1: Generate recovery tips specific to diagnosed disease
 * - 19.2: Include warning signs requiring immediate medical attention
 * - 19.3: Specify expected recovery timeline milestones
 * - 19.4: Provide guidance on self-monitoring techniques
 * - 19.5: Include when to schedule follow-up appointments
 */
export async function generateRecoveryRecommendations(
  input: RecoveryRecommendationInput
): Promise<RecoveryRecommendations> {
  const { diagnosis, patientAge, patientGender } = input;

  const systemPrompt = `You are a medical expert specializing in patient recovery and lifestyle medicine. Generate personalized daily life modifications and recovery tips for a patient based on their diagnosis and profile.

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text.

The response must include:

1. dailyLifeModifications: Array of at least 6 modifications with:
   - modification: Brief title of the modification
   - category: One of "sleep", "stress_management", "physical_activity", or "other"
   - specificGuidance: Detailed, measurable guidance (e.g., "Sleep 7-8 hours per night, go to bed by 10 PM", "Walk 20 minutes daily at moderate pace")
   - expectedImpact: One of "high", "medium", or "low" (impact on recovery)
   - difficulty: One of "easy", "moderate", or "challenging" (difficulty to implement)

   CATEGORY REQUIREMENTS:
   - Include at least 2 sleep-related modifications
   - Include at least 2 stress management modifications
   - Include at least 2 physical activity modifications

   SORTING REQUIREMENTS:
   - Sort by expectedImpact first (high > medium > low)
   - Within same impact level, sort by difficulty (easy > moderate > challenging)

2. recoveryTips: Array of at least 8 tips with:
   - tip: Brief title of the tip
   - category: One of "warning_signs", "timeline", "monitoring", or "follow_up"
   - description: Detailed explanation

   CATEGORY REQUIREMENTS:
   - Include at least 3 warning signs (symptoms requiring immediate medical attention)
   - Include at least 2 timeline milestones (expected recovery stages with timeframes)
   - Include at least 2 monitoring techniques (how to track recovery progress)
   - Include at least 1 follow-up guidance (when to schedule appointments)

CRITICAL REQUIREMENTS:
- Use specific, measurable guidance (numbers, times, frequencies)
- Use clear, non-technical language patients can understand
- Be realistic and practical for daily implementation
- Prioritize modifications by impact on recovery
- Make warning signs clear and actionable`;

  const userPrompt = `Generate recovery recommendations for:
- Diagnosis: ${diagnosis}
- Patient Age: ${patientAge}
- Patient Gender: ${patientGender}

Provide specific, actionable recovery recommendations in JSON format.
Remember to sort daily life modifications by impact (high first) then difficulty (easy first).`;

  try {
    const response = await callGeminiJson<RecoveryRecommendations>(
      systemPrompt,
      userPrompt,
      ['dailyLifeModifications', 'recoveryTips'],
      { maxTokens: 3000, temperature: 0.7 }
    );

    // Validate and sort recommendations
    validateRecoveryRecommendations(response);
    
    // Ensure proper sorting of daily life modifications
    response.dailyLifeModifications.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      const difficultyOrder = { easy: 0, moderate: 1, challenging: 2 };
      
      // Sort by impact first
      const impactDiff = impactOrder[a.expectedImpact] - impactOrder[b.expectedImpact];
      if (impactDiff !== 0) return impactDiff;
      
      // Then by difficulty (easiest first)
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });

    return response;
  } catch (error) {
    console.error('Error generating recovery recommendations:', error);
    throw new Error('Failed to generate recovery recommendations');
  }
}

/**
 * Validate recovery recommendations structure and content
 * 
 * @param recommendations - The generated recommendations
 * @throws Error if validation fails
 */
function validateRecoveryRecommendations(
  recommendations: RecoveryRecommendations
): void {
  // Validate dailyLifeModifications
  if (!Array.isArray(recommendations.dailyLifeModifications) || 
      recommendations.dailyLifeModifications.length < 6) {
    throw new Error('dailyLifeModifications must contain at least 6 items');
  }

  const categoryCounts = {
    sleep: 0,
    stress_management: 0,
    physical_activity: 0,
    other: 0
  };

  // Validate each daily life modification
  for (const mod of recommendations.dailyLifeModifications) {
    if (!mod.modification || typeof mod.modification !== 'string') {
      throw new Error('Each modification must have a modification title');
    }

    if (!mod.category || !['sleep', 'stress_management', 'physical_activity', 'other'].includes(mod.category)) {
      throw new Error('Each modification must have a valid category');
    }

    if (!mod.specificGuidance || typeof mod.specificGuidance !== 'string') {
      throw new Error('Each modification must have specific guidance');
    }

    if (!mod.expectedImpact || !['high', 'medium', 'low'].includes(mod.expectedImpact)) {
      throw new Error('Each modification must have a valid expectedImpact');
    }

    if (!mod.difficulty || !['easy', 'moderate', 'challenging'].includes(mod.difficulty)) {
      throw new Error('Each modification must have a valid difficulty');
    }

    categoryCounts[mod.category]++;
  }

  // Validate category distribution
  if (categoryCounts.sleep < 2) {
    throw new Error('Must have at least 2 sleep-related modifications');
  }

  if (categoryCounts.stress_management < 2) {
    throw new Error('Must have at least 2 stress management modifications');
  }

  if (categoryCounts.physical_activity < 2) {
    throw new Error('Must have at least 2 physical activity modifications');
  }

  // Validate recoveryTips
  if (!Array.isArray(recommendations.recoveryTips) || 
      recommendations.recoveryTips.length < 8) {
    throw new Error('recoveryTips must contain at least 8 items');
  }

  const tipCategoryCounts = {
    warning_signs: 0,
    timeline: 0,
    monitoring: 0,
    follow_up: 0
  };

  // Validate each recovery tip
  for (const tip of recommendations.recoveryTips) {
    if (!tip.tip || typeof tip.tip !== 'string') {
      throw new Error('Each recovery tip must have a tip title');
    }

    if (!tip.category || !['warning_signs', 'timeline', 'monitoring', 'follow_up'].includes(tip.category)) {
      throw new Error('Each recovery tip must have a valid category');
    }

    if (!tip.description || typeof tip.description !== 'string') {
      throw new Error('Each recovery tip must have a description');
    }

    tipCategoryCounts[tip.category]++;
  }

  // Validate tip category distribution
  if (tipCategoryCounts.warning_signs < 3) {
    throw new Error('Must have at least 3 warning signs');
  }

  if (tipCategoryCounts.timeline < 2) {
    throw new Error('Must have at least 2 timeline milestones');
  }

  if (tipCategoryCounts.monitoring < 2) {
    throw new Error('Must have at least 2 monitoring techniques');
  }

  if (tipCategoryCounts.follow_up < 1) {
    throw new Error('Must have at least 1 follow-up guidance');
  }
}

/**
 * Format recovery recommendations as plain text for display
 * 
 * @param recommendations - The recovery recommendations to format
 * @returns Formatted string representation
 */
export function formatRecoveryRecommendations(recommendations: RecoveryRecommendations): string {
  let output = 'RECOVERY RECOMMENDATIONS\n\n';

  // Daily Life Modifications
  output += '═══════════════════════════════════════\n';
  output += 'DAILY LIFE MODIFICATIONS\n';
  output += '═══════════════════════════════════════\n\n';

  // Group by impact level
  const highImpact = recommendations.dailyLifeModifications.filter(m => m.expectedImpact === 'high');
  const mediumImpact = recommendations.dailyLifeModifications.filter(m => m.expectedImpact === 'medium');
  const lowImpact = recommendations.dailyLifeModifications.filter(m => m.expectedImpact === 'low');

  if (highImpact.length > 0) {
    output += '🔴 HIGH IMPACT (Prioritize These):\n\n';
    highImpact.forEach((mod, index) => {
      output += `${index + 1}. ${mod.modification}\n`;
      output += `   Category: ${formatCategory(mod.category)}\n`;
      output += `   Guidance: ${mod.specificGuidance}\n`;
      output += `   Difficulty: ${formatDifficulty(mod.difficulty)}\n\n`;
    });
  }

  if (mediumImpact.length > 0) {
    output += '🟡 MEDIUM IMPACT:\n\n';
    mediumImpact.forEach((mod, index) => {
      output += `${index + 1}. ${mod.modification}\n`;
      output += `   Category: ${formatCategory(mod.category)}\n`;
      output += `   Guidance: ${mod.specificGuidance}\n`;
      output += `   Difficulty: ${formatDifficulty(mod.difficulty)}\n\n`;
    });
  }

  if (lowImpact.length > 0) {
    output += '🟢 LOWER IMPACT (Still Beneficial):\n\n';
    lowImpact.forEach((mod, index) => {
      output += `${index + 1}. ${mod.modification}\n`;
      output += `   Category: ${formatCategory(mod.category)}\n`;
      output += `   Guidance: ${mod.specificGuidance}\n`;
      output += `   Difficulty: ${formatDifficulty(mod.difficulty)}\n\n`;
    });
  }

  // Recovery Tips
  output += '\n═══════════════════════════════════════\n';
  output += 'RECOVERY TIPS & MONITORING\n';
  output += '═══════════════════════════════════════\n\n';

  // Group by category
  const warningTips = recommendations.recoveryTips.filter(t => t.category === 'warning_signs');
  const timelineTips = recommendations.recoveryTips.filter(t => t.category === 'timeline');
  const monitoringTips = recommendations.recoveryTips.filter(t => t.category === 'monitoring');
  const followUpTips = recommendations.recoveryTips.filter(t => t.category === 'follow_up');

  if (warningTips.length > 0) {
    output += '⚠️  WARNING SIGNS - SEEK IMMEDIATE MEDICAL ATTENTION IF:\n\n';
    warningTips.forEach((tip, index) => {
      output += `${index + 1}. ${tip.tip}\n`;
      output += `   ${tip.description}\n\n`;
    });
  }

  if (timelineTips.length > 0) {
    output += '📅 EXPECTED RECOVERY TIMELINE:\n\n';
    timelineTips.forEach((tip, index) => {
      output += `${index + 1}. ${tip.tip}\n`;
      output += `   ${tip.description}\n\n`;
    });
  }

  if (monitoringTips.length > 0) {
    output += '📊 SELF-MONITORING GUIDANCE:\n\n';
    monitoringTips.forEach((tip, index) => {
      output += `${index + 1}. ${tip.tip}\n`;
      output += `   ${tip.description}\n\n`;
    });
  }

  if (followUpTips.length > 0) {
    output += '🏥 FOLLOW-UP APPOINTMENTS:\n\n';
    followUpTips.forEach((tip, index) => {
      output += `${index + 1}. ${tip.tip}\n`;
      output += `   ${tip.description}\n\n`;
    });
  }

  return output;
}

/**
 * Format category name for display
 */
function formatCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    sleep: '😴 Sleep',
    stress_management: '🧘 Stress Management',
    physical_activity: '🏃 Physical Activity',
    other: '📋 General'
  };
  return categoryMap[category] || category;
}

/**
 * Format difficulty level for display
 */
function formatDifficulty(difficulty: ModificationDifficulty): string {
  const difficultyMap: Record<ModificationDifficulty, string> = {
    easy: '✅ Easy to implement',
    moderate: '⚡ Moderate effort',
    challenging: '💪 Requires commitment'
  };
  return difficultyMap[difficulty];
}
