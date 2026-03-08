// Google Gemini AI client configuration
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Configuration options for Gemini API calls
 */
export interface GeminiCallOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  timeout?: number;
}

/**
 * Get Gemini API key from environment variable
 */
function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Call Gemini API with retry logic and timeout
 */
export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  maxRetries: number = 3,
  options: GeminiCallOptions = {}
): Promise<string> {
  const {
    maxTokens = 2000,
    temperature = 0.7,
    topP = 0.9,
    timeout = 30000 // 30 seconds default timeout
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini API call attempt ${attempt}: model=gemini-1.5-flash`);
      
      // Initialize Gemini client
      const genAI = new GoogleGenerativeAI(getGeminiApiKey());
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
          topP
        }
      });

      // Combine system and user prompts
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini API call timeout')), timeout);
      });

      // Race between API call and timeout
      const result = await Promise.race([
        model.generateContent(fullPrompt),
        timeoutPromise
      ]);

      const response = result.response;
      const text = response.text();

      if (text) {
        console.log('Gemini API call succeeded!');
        return text;
      }

      throw new Error('Empty response from Gemini');
    } catch (error: any) {
      lastError = error;
      console.error(`Gemini API call attempt ${attempt} failed:`, error);
      console.error(`Error name: ${error.name}, message: ${error.message}`);

      // Check if it's a rate limit error
      if (error.message?.includes('429') && attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited, retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // If not retriable or last attempt, throw
      if (attempt === maxRetries) {
        throw new Error(`Gemini API failed after ${maxRetries} attempts: ${error.message}`);
      }
    }
  }

  throw lastError || new Error('Gemini API call failed');
}

/**
 * Parse JSON response from Gemini with validation
 */
export function parseGeminiJson<T>(response: string): T {
  try {
    // Remove markdown code blocks if present
    const cleaned = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error('Failed to parse Gemini response:', response);
    throw new Error('Invalid JSON response from Gemini');
  }
}

/**
 * Validate response against expected schema
 * @param data The parsed JSON data
 * @param requiredFields Array of required field names
 * @returns true if valid, throws error if invalid
 */
export function validateGeminiResponse(data: any, requiredFields: string[]): boolean {
  if (!data || typeof data !== 'object') {
    throw new Error('Response is not a valid object');
  }

  const missingFields = requiredFields.filter(field => !(field in data));
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  return true;
}

/**
 * Call Gemini and parse JSON response with validation
 * @param systemPrompt System prompt for Gemini
 * @param userPrompt User prompt for Gemini
 * @param requiredFields Array of required fields in the response
 * @param options Optional configuration for the API call
 * @returns Parsed and validated JSON response
 */
export async function callGeminiJson<T>(
  systemPrompt: string,
  userPrompt: string,
  requiredFields: string[] = [],
  options: GeminiCallOptions = {}
): Promise<T> {
  const response = await callGemini(systemPrompt, userPrompt, 3, options);
  const parsed = parseGeminiJson<T>(response);
  
  if (requiredFields.length > 0) {
    validateGeminiResponse(parsed, requiredFields);
  }
  
  return parsed;
}
