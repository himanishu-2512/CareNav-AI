// Activity Avoidance Recommender Module
// Generates AI-powered activity avoidance recommendations based on diagnosis
// Requirements: 17.1, 17.2, 17.3, 17.4, 17.5

import { callGeminiJson } from './gemini-client';

/**
 * Priority levels for activity avoidance recommendations
 */
export type ActivityPriority = 'critical' | 'high' | 'medium';

/**
 * Represents a single activity avoidance recommendation
 */
export interface ActivityRecommendation {
  activity: string;
  reason: string;
  duration: string;
  priority: ActivityPriority;
}

/**
 * Complete activity avoidance recommendations structure
 */
export interface ActivityAvoidanceRecommendations {
  activitiesToAvoid: ActivityRecommendation[];
}

/**
 * Input parameters for generating activity avoidance recommendations
 */
export interface ActivityAvoidanceInput {
  diagnosis: string;
  patientAge: number;
  patientGender: string;
}

/**
 * Generate personalized activity avoidance recommendations using AI
 * 
 * @param input - Patient information and diagnosis
 * @returns Structured activity avoidance recommendations
 * 
 * Requirements:
 * - 17.1: Generate list of activities to avoid based on diagnosed disease
 * - 17.2: Explain the reason for each avoidance recommendation
 * - 17.3: Specify the duration for which each activity should be avoided
 * - 17.4: Prioritize critical avoidances at the top of the list
 * - 17.5: Use clear, non-technical language for activity descriptions
 */
export async function generateActivityAvoidanceRecommendations(
  input: ActivityAvoidanceInput
): Promise<ActivityAvoidanceRecommendations> {
  const { diagnosis, patientAge, patientGender } = input;

  const systemPrompt = `You are a medical expert specializing in patient recovery and activity management. Generate personalized activity avoidance recommendations for a patient based on their diagnosis and profile.

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text.

The response must include:
1. activitiesToAvoid: Array of at least 5 activity recommendations with:
   - activity: Name of the activity to avoid (use clear, non-technical language)
   - reason: Clear explanation of why this activity should be avoided
   - duration: Specific timeframe for avoidance (e.g., "2 weeks", "until symptoms resolve", "3 months", "during treatment")
   - priority: One of "critical", "high", or "medium"

PRIORITY GUIDELINES:
- "critical": Activities that could cause immediate harm, worsen the condition significantly, or delay recovery substantially
- "high": Activities that should be avoided to prevent complications or slow recovery
- "medium": Activities that are advisable to avoid for optimal recovery

CRITICAL REQUIREMENTS:
- Use clear, simple language that patients can easily understand
- Avoid medical jargon - use everyday terms
- Be specific about activities (e.g., "heavy lifting over 10 pounds" not just "strenuous activity")
- Provide clear, actionable duration guidance
- Ensure activities are sorted by priority: critical first, then high, then medium
- Include at least 2 critical priority items
- Include at least 2 high priority items
- Include at least 1 medium priority item`;

  const userPrompt = `Generate activity avoidance recommendations for:
- Diagnosis: ${diagnosis}
- Patient Age: ${patientAge}
- Patient Gender: ${patientGender}

Provide specific, actionable activity avoidance recommendations in JSON format.
Remember to sort by priority: critical items first, then high, then medium.`;

  try {
    const response = await callGeminiJson<ActivityAvoidanceRecommendations>(
      systemPrompt,
      userPrompt,
      ['activitiesToAvoid'],
      { maxTokens: 2000, temperature: 0.7 }
    );

    // Validate and sort recommendations
    validateActivityRecommendations(response);
    
    // Ensure proper priority sorting
    response.activitiesToAvoid.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return response;
  } catch (error) {
    console.error('Error generating activity avoidance recommendations:', error);
    throw new Error('Failed to generate activity avoidance recommendations');
  }
}

/**
 * Validate activity avoidance recommendations structure and content
 * 
 * @param recommendations - The generated recommendations
 * @throws Error if validation fails
 */
function validateActivityRecommendations(
  recommendations: ActivityAvoidanceRecommendations
): void {
  // Validate activitiesToAvoid exists and is an array
  if (!Array.isArray(recommendations.activitiesToAvoid) || recommendations.activitiesToAvoid.length < 5) {
    throw new Error('activitiesToAvoid must contain at least 5 items');
  }

  const priorityCounts = { critical: 0, high: 0, medium: 0 };

  // Validate each activity recommendation has required fields
  for (const activity of recommendations.activitiesToAvoid) {
    if (!activity.activity || typeof activity.activity !== 'string') {
      throw new Error('Each activity recommendation must have an activity name');
    }

    if (!activity.reason || typeof activity.reason !== 'string') {
      throw new Error('Each activity recommendation must have a reason');
    }

    if (!activity.duration || typeof activity.duration !== 'string') {
      throw new Error('Each activity recommendation must have a duration');
    }

    if (!activity.priority || !['critical', 'high', 'medium'].includes(activity.priority)) {
      throw new Error('Each activity recommendation must have a valid priority (critical, high, or medium)');
    }

    priorityCounts[activity.priority]++;
  }

  // Validate priority distribution
  if (priorityCounts.critical < 2) {
    throw new Error('Must have at least 2 critical priority items');
  }

  if (priorityCounts.high < 2) {
    throw new Error('Must have at least 2 high priority items');
  }

  if (priorityCounts.medium < 1) {
    throw new Error('Must have at least 1 medium priority item');
  }
}

/**
 * Format activity avoidance recommendations as plain text for display
 * 
 * @param recommendations - The activity avoidance recommendations to format
 * @returns Formatted string representation
 */
export function formatActivityAvoidanceRecommendations(
  recommendations: ActivityAvoidanceRecommendations
): string {
  let output = 'ACTIVITIES TO AVOID\n\n';

  // Group by priority for display
  const critical = recommendations.activitiesToAvoid.filter(a => a.priority === 'critical');
  const high = recommendations.activitiesToAvoid.filter(a => a.priority === 'high');
  const medium = recommendations.activitiesToAvoid.filter(a => a.priority === 'medium');

  // Critical activities
  if (critical.length > 0) {
    output += '⚠️  CRITICAL - MUST AVOID:\n';
    critical.forEach((activity, index) => {
      output += `${index + 1}. ${activity.activity}\n`;
      output += `   Why: ${activity.reason}\n`;
      output += `   Duration: ${activity.duration}\n\n`;
    });
  }

  // High priority activities
  if (high.length > 0) {
    output += '🔴 HIGH PRIORITY - STRONGLY AVOID:\n';
    high.forEach((activity, index) => {
      output += `${index + 1}. ${activity.activity}\n`;
      output += `   Why: ${activity.reason}\n`;
      output += `   Duration: ${activity.duration}\n\n`;
    });
  }

  // Medium priority activities
  if (medium.length > 0) {
    output += '🟡 MEDIUM PRIORITY - ADVISABLE TO AVOID:\n';
    medium.forEach((activity, index) => {
      output += `${index + 1}. ${activity.activity}\n`;
      output += `   Why: ${activity.reason}\n`;
      output += `   Duration: ${activity.duration}\n\n`;
    });
  }

  return output;
}
