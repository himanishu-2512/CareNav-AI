// Hugging Face Inference API client for AI question generation
// Using free tier - no API key required for some models

interface HuggingFaceResponse {
  generated_text?: string;
  error?: string;
}

/**
 * Generate medical questions using Hugging Face's free inference API
 */
export async function generateMedicalQuestions(
  symptomText: string,
  previousAnswers: string[],
  diseaseNames: string[],
  roundNumber: number
): Promise<string[]> {
  try {
    const prompt = buildQuestionPrompt(symptomText, previousAnswers, diseaseNames, roundNumber);
    
    // Try multiple free models
    const models = [
      'mistralai/Mistral-7B-Instruct-v0.2',
      'meta-llama/Llama-2-7b-chat-hf',
      'google/flan-t5-large'
    ];
    
    for (const model of models) {
      try {
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                max_new_tokens: 500,
                temperature: 0.7,
                return_full_text: false
              }
            })
          }
        );

        if (!response.ok) {
          console.log(`Model ${model} failed:`, response.status);
          continue;
        }

        const data = await response.json() as HuggingFaceResponse[];
        
        if (data && data[0]?.generated_text) {
          const questions = parseQuestions(data[0].generated_text);
          if (questions.length === 5) {
            console.log(`Successfully generated questions using ${model}`);
            return questions;
          }
        }
      } catch (modelError) {
        console.log(`Model ${model} error:`, modelError);
        continue;
      }
    }
    
    throw new Error('All models failed');
    
  } catch (error) {
    console.error('Hugging Face question generation failed:', error);
    throw error;
  }
}

function buildQuestionPrompt(
  symptomText: string,
  previousAnswers: string[],
  diseaseNames: string[],
  roundNumber: number
): string {
  const context = previousAnswers.length > 0 
    ? `\n\nPrevious answers: ${previousAnswers.join('; ')}`
    : '';
  
  const diseases = diseaseNames.length > 0
    ? `\n\nPossible conditions: ${diseaseNames.slice(0, 3).join(', ')}`
    : '';

  return `You are a medical AI assistant. Generate exactly 5 diagnostic questions for a patient.

Patient symptoms: ${symptomText}${diseases}${context}

This is round ${roundNumber} of 4. Generate 5 specific, relevant medical questions to help diagnose the patient. Each question should be on a new line starting with "Q1:", "Q2:", etc.

Questions:`;
}

function parseQuestions(text: string): string[] {
  const lines = text.split('\n').filter(line => line.trim());
  const questions: string[] = [];
  
  for (const line of lines) {
    // Match patterns like "Q1:", "1.", "Question 1:", etc.
    const match = line.match(/^(?:Q\d+:|Question\s+\d+:|\d+\.)\s*(.+)/i);
    if (match && match[1]) {
      questions.push(match[1].trim());
    }
  }
  
  return questions.slice(0, 5);
}
