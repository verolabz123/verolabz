import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger.js";

let groqClient: Groq | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

/**
 * Initialize Groq SDK client
 */
export function initializeGroq(): Groq {
  if (groqClient) {
    return groqClient;
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    logger.warn("GROQ_API_KEY not found, will use Gemini as primary");
    return null as any;
  }

  groqClient = new Groq({
    apiKey: apiKey,
  });

  logger.info("Groq SDK initialized successfully");

  return groqClient;
}

/**
 * Initialize Gemini SDK client
 */
export function initializeGemini(): GoogleGenerativeAI {
  if (geminiClient) {
    return geminiClient;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is required for fallback",
    );
  }

  geminiClient = new GoogleGenerativeAI(apiKey);

  logger.info("Gemini SDK initialized successfully");

  return geminiClient;
}

/**
 * Get Groq client instance
 */
export function getGroqClient(): Groq | null {
  if (!groqClient && process.env.GROQ_API_KEY) {
    return initializeGroq();
  }
  return groqClient;
}

/**
 * Get Gemini client instance
 */
export function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    return initializeGemini();
  }
  return geminiClient;
}

/**
 * Groq model configurations
 */
export const GROQ_MODELS = {
  LLAMA_70B: "llama-3.1-70b-versatile",
  LLAMA_8B: "llama-3.1-8b-instant",
  MIXTRAL_8X7B: "mixtral-8x7b-32768",
  GEMMA_7B: "gemma-7b-it",
} as const;

/**
 * Gemini model configurations
 */
export const GEMINI_MODELS = {
  FLASH_2_5: "gemini-2.0-flash-exp",
  FLASH_1_5: "gemini-1.5-flash",
  PRO_1_5: "gemini-1.5-pro",
} as const;

/**
 * Get the configured Groq model
 */
export function getGroqModel(): string {
  return process.env.GROQ_MODEL || GROQ_MODELS.LLAMA_70B;
}

/**
 * Get the configured Gemini model
 */
export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || GEMINI_MODELS.FLASH_2_5;
}

/**
 * Convert chat messages to Gemini format
 */
function convertMessagesToGeminiFormat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
): string {
  let prompt = "";

  for (const msg of messages) {
    if (msg.role === "system") {
      prompt += `System Instructions: ${msg.content}\n\n`;
    } else if (msg.role === "user") {
      prompt += `User: ${msg.content}\n\n`;
    } else if (msg.role === "assistant") {
      prompt += `Assistant: ${msg.content}\n\n`;
    }
  }

  return prompt.trim();
}

/**
 * Call Gemini API
 */
async function callGeminiAPI(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
  },
): Promise<string> {
  try {
    const client = getGeminiClient();
    const modelName = getGeminiModel();

    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    });

    const prompt = convertMessagesToGeminiFormat(messages);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("No content returned from Gemini API");
    }

    return text;
  } catch (error) {
    logger.error("Gemini API error:", error);
    throw new Error(
      `Gemini API error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Chat completion with automatic Gemini fallback
 */
export async function chatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    stream?: boolean;
    skipGroq?: boolean;
  },
): Promise<string> {
  // Try Groq first if available and not skipped
  if (!options?.skipGroq) {
    const groq = getGroqClient();
    if (groq) {
      try {
        const model = options?.model || getGroqModel();

        logger.debug(`Calling Groq API with model: ${model}`);

        const response = await groq.chat.completions.create({
          model: model,
          messages: messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2048,
          top_p: options?.topP ?? 1,
          stream: false,
        });

        if ("choices" in response && Array.isArray(response.choices)) {
          const content = response.choices[0]?.message?.content;

          if (!content) {
            throw new Error("No content returned from Groq API");
          }

          logger.debug("Successfully received response from Groq");
          return content;
        }

        throw new Error("Invalid response format from Groq API");
      } catch (error) {
        logger.warn("Groq API failed, falling back to Gemini:", error);
      }
    } else {
      logger.info("Groq not configured, using Gemini");
    }
  }

  // Fallback to Gemini
  logger.info("Using Gemini AI for completion");
  return await callGeminiAPI(messages, {
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
  });
}

/**
 * Streaming chat completion wrapper
 */
export async function streamChatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  onChunk: (chunk: string) => void,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  },
): Promise<string> {
  const groq = getGroqClient();

  if (!groq) {
    // Gemini doesn't support streaming in the same way, so we call it normally
    logger.info("Using Gemini for streaming (non-streaming mode)");
    const result = await callGeminiAPI(messages, {
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });
    onChunk(result);
    return result;
  }

  try {
    const model = options?.model || getGroqModel();

    const stream = await groq.chat.completions.create({
      model: model,
      messages: messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      top_p: options?.topP ?? 1,
      stream: true,
    });

    let fullContent = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullContent += content;
        onChunk(content);
      }
    }

    return fullContent;
  } catch (error) {
    logger.warn("Groq streaming failed, falling back to Gemini:", error);
    const result = await callGeminiAPI(messages, {
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });
    onChunk(result);
    return result;
  }
}

/**
 * Parse JSON response with Gemini fallback
 */
export async function chatCompletionJSON<T = any>(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  },
): Promise<T> {
  try {
    const content = await chatCompletion(messages, {
      ...options,
      temperature: options?.temperature ?? 0.3,
    });

    // Extract JSON from markdown code blocks if present
    let jsonString = content.trim();

    // Remove markdown code blocks
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    // Parse JSON
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    logger.error("Failed to parse JSON from AI response:", error);
    throw new Error(
      `Failed to parse JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Token counter estimation (approximate)
 */
export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Check if text exceeds token limit
 */
export function exceedsTokenLimit(
  text: string,
  maxTokens: number = 32000,
): boolean {
  return estimateTokens(text) > maxTokens;
}

/**
 * Truncate text to fit within token limit
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number = 32000,
): string {
  const estimatedTokens = estimateTokens(text);

  if (estimatedTokens <= maxTokens) {
    return text;
  }

  // Calculate approximate character limit
  const maxChars = maxTokens * 4;
  return text.substring(0, maxChars) + "... [truncated]";
}

export default {
  initializeGroq,
  initializeGemini,
  getGroqClient,
  getGeminiClient,
  getGroqModel,
  getGeminiModel,
  chatCompletion,
  streamChatCompletion,
  chatCompletionJSON,
  estimateTokens,
  exceedsTokenLimit,
  truncateToTokenLimit,
  GROQ_MODELS,
  GEMINI_MODELS,
};
