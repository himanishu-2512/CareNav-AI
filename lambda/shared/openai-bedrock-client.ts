// OpenAI client configured to use AWS Bedrock via OpenAI-compatible API
import OpenAI from "openai";
import { extractQuestionTags } from "./comprehend-medical-client";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AWS_BEARER_TOKEN_BEDROCK,
  baseURL: process.env.OPENAI_BASE_URL || "https://bedrock-mantle.ap-south-1.api.aws/v1",
});

/**
 * Generate medical questions using AI (via Bedrock OpenAI-compatible API)
 * Returns questions with extracted medical tags
 */
export async function generateAIQuestions(
  symptomText: string,
  previousAnswers: Array<{ questionText: string; answerText: string; tags?: string[] }>,
  diseaseNames: string[],
  bodyPart: string,
  roundNumber: number,
  medicalEntities?: {
    symptoms: string[];
    bodyParts: string[];
    medications: string[];
    duration: string | null;
  }
): Promise<Array<{ question: string; tags: string[] }>> {
  try {
    const prompt = buildMedicalQuestionPrompt(
      symptomText,
      previousAnswers,
      diseaseNames,
      bodyPart,
      roundNumber,
      medicalEntities
    );

    console.log(`[AI] Generating Round ${roundNumber} questions...`);
    console.log(`[AI] Prompt length: ${prompt.length} chars`);

    const response = await client.chat.completions.create({
      model: "openai.gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `Medical triage assistant. Generate EXACTLY 5 diagnostic questions.

CRITICAL RULES:
- MUST generate exactly 5 questions
- NEVER repeat any previous questions (check COVERED_TOPICS list)
- NEVER ask about topics already covered
- Each question must gather NEW medical information
- Short, clinical questions only
- One symptom per question

Format:
1. Question?
2. Question?
3. Question?
4. Question?
5. Question?`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      top_p: 0.95,
      max_tokens: 800,
    });

    const generatedText = response.choices[0]?.message?.content || "";
    console.log(`[AI] Response received (${generatedText.length} chars)`);

    const questions = parseAIQuestions(generatedText);
    console.log(`[AI] Parsed ${questions.length} questions`);

    if (questions.length < 3) {
      throw new Error("Failed to generate valid questions");
    }

    // Extract tags for each question using Comprehend Medical
    console.log(`[AI] Extracting medical tags for ${questions.length} questions...`);
    const questionsWithTags = await Promise.all(
      questions.slice(0, 5).map(async (q) => {
        const tags = await extractQuestionTags(q);
        console.log(`[AI] Question tags: ${tags.join(', ')}`);
        return { question: q, tags };
      })
    );

    console.log(`[AI] ✓ Successfully generated ${questionsWithTags.length} questions with tags for Round ${roundNumber}`);
    return questionsWithTags;
    
  } catch (error) {
    console.error("[AI] Question generation failed:", error);
    throw error;
  }
}

/**
 * Build prompt for AI - uses tags instead of full questions to save tokens
 */
function buildMedicalQuestionPrompt(
  symptomText: string,
  previousAnswers: Array<{ questionText: string; answerText: string; tags?: string[] }>,
  diseaseNames: string[],
  bodyPart: string,
  roundNumber: number,
  medicalEntities?: {
    symptoms: string[];
    bodyParts: string[];
    medications: string[];
    duration: string | null;
  }
): string {
  let prompt = `ROUND: ${roundNumber}
SYMPTOM: ${symptomText}
BODY_PART: ${bodyPart}
`;

  if (diseaseNames?.length) {
    prompt += `CONDITIONS: ${diseaseNames.join(", ")}\n`;
  }

  if (previousAnswers.length > 0) {
    // Use tags instead of full questions to save tokens and avoid repetition
    const allTags = new Set<string>();
    previousAnswers.forEach(qa => {
      if (qa.tags && qa.tags.length > 0) {
        qa.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    if (allTags.size > 0) {
      prompt += `\nCOVERED_TOPICS (DO NOT ask about these again):\n${Array.from(allTags).join(', ')}\n`;
    }
    
    // Show recent answers (last 3 only)
    prompt += `\nRECENT_ANSWERS:\n`;
    const recentAnswers = previousAnswers.slice(-3);
    recentAnswers.forEach((qa, idx) => {
      const answerNum = previousAnswers.length - recentAnswers.length + idx + 1;
      const shortAnswer = qa.answerText.substring(0, 50);
      prompt += `${answerNum}. ${shortAnswer}\n`;
    });
  }

  prompt += `\nGenerate 5 NEW questions (avoid covered topics):`;

  return prompt;
}

/**
 * Parse AI generated questions
 */
function parseAIQuestions(text: string): string[] {
  const lines = text.split("\n").filter((line) => line.trim());
  const questions: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*(?:\d+[\.\)]|\-\s*|\*\s*|Q\d+:|Question\s+\d+:)\s*(.+)/i);
    if (match && match[1]) {
      let question = match[1].trim();

      if (!question.endsWith("?")) {
        question += "?";
      }

      if (question.length >= 15 && /[a-zA-Z]{3,}/.test(question)) {
        questions.push(question);
      }
    }
  }

  // fallback extraction
  if (questions.length < 5) {
    const fallback = text
      .split("?")
      .map((q) => q.trim())
      .filter((q) => q.length > 15)
      .map((q) => q + "?");
    questions.push(...fallback);
  }

  return questions.slice(0, 5);
}
