// Shared Bedrock client configuration
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// HARDCODED region to us-east-1 - do not use environment variables
const BEDROCK_REGION = 'us-east-1';

// Create Bedrock Runtime client with HARDCODED region
export const bedrockClient = new BedrockRuntimeClient({
  region: BEDROCK_REGION
});

// Use Amazon Nova 2 Lite for medical question generation (available in us-east-1)
export const BEDROCK_MODEL_ID = 'global.amazon.nova-2-lite-v1:0';

/**
 * Configuration options for Bedrock API calls
 */
export interface BedrockCallOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  timeout?: number;
}

/**
 * Call Bedrock API with retry logic and timeout using InvokeModelCommand
 */
export async function callBedrock(
  systemPrompt: string,
  userPrompt: string,
  maxRetries: number = 3,
  options: BedrockCallOptions = {}
): Promise<string> {
  const {
    maxTokens = 2000,
    temperature = 0.7,
    topP = 0.9,
    timeout = 10000 // 10 seconds default timeout
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use Claude 3 Sonnet in us-east-1 for medical questions
      const client = new BedrockRuntimeClient({
        region: 'us-east-1' // Claude models available in us-east-1
      });
      
      // Log the model ID and region for debugging
      console.log(`Bedrock API call attempt ${attempt}: modelId=${BEDROCK_MODEL_ID}, region=us-east-1`);
      
      // Prepare request body for Amazon Nova 2 Lite
      const requestBody = {
        messages: [
          {
            role: 'user',
            content: [
              { text: `${systemPrompt}\n\n${userPrompt}` }
            ]
          }
        ],
        inferenceConfig: {
          max_new_tokens: maxTokens,
          temperature,
          top_p: topP
        }
      };

      const command = new InvokeModelCommand({
        modelId: BEDROCK_MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody)
      });

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Bedrock API call timeout')), timeout);
      });

      // Race between API call and timeout
      const response = await Promise.race([
        client.send(command),
        timeoutPromise
      ]);
      
      // Parse response body
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      // Amazon Nova response format
      if (responseBody.output?.message?.content?.[0]?.text) {
        console.log('Bedrock API call succeeded!');
        return responseBody.output.message.content[0].text;
      }

      throw new Error('Invalid response format from Bedrock');
    } catch (error: any) {
      lastError = error;
      console.error(`Bedrock API call attempt ${attempt} failed:`, error);
      console.error(`Error name: ${error.name}, message: ${error.message}`);

      // Check if it's a throttling error or validation error
      if ((error.name === 'ThrottlingException' || error.name === 'ValidationException') && attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // If not retriable or last attempt, throw
      if (attempt === maxRetries) {
        throw new Error(`Bedrock API failed after ${maxRetries} attempts: ${error.message}`);
      }
    }
  }

  throw lastError || new Error('Bedrock API call failed');
}

/**
 * Parse JSON response from Bedrock with validation
 */
export function parseBedrockJson<T>(response: string): T {
  try {
    // Remove markdown code blocks if present
    const cleaned = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error('Failed to parse Bedrock response:', response);
    throw new Error('Invalid JSON response from Bedrock');
  }
}

/**
 * Validate response against expected schema
 * @param data The parsed JSON data
 * @param requiredFields Array of required field names
 * @returns true if valid, throws error if invalid
 */
export function validateBedrockResponse(data: any, requiredFields: string[]): boolean {
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
 * Call Bedrock and parse JSON response with validation
 * @param systemPrompt System prompt for Bedrock
 * @param userPrompt User prompt for Bedrock
 * @param requiredFields Array of required fields in the response
 * @param options Optional configuration for the API call
 * @returns Parsed and validated JSON response
 */
export async function callBedrockJson<T>(
  systemPrompt: string,
  userPrompt: string,
  requiredFields: string[] = [],
  options: BedrockCallOptions = {}
): Promise<T> {
  const response = await callBedrock(systemPrompt, userPrompt, 3, options);
  const parsed = parseBedrockJson<T>(response);
  
  if (requiredFields.length > 0) {
    validateBedrockResponse(parsed, requiredFields);
  }
  
  return parsed;
}
