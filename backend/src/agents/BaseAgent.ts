import { chatCompletion, chatCompletionJSON } from '../config/groq.js';
import { logger } from '../utils/logger.js';

/**
 * Base Agent Interface
 */
export interface AgentConfig {
  name: string;
  role: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Agent Response Interface
 */
export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  reasoning?: string;
  metadata?: Record<string, any>;
}

/**
 * Base AI Agent Class
 * All specialized agents inherit from this class
 */
export abstract class BaseAgent {
  protected config: AgentConfig;
  protected systemPrompt: string;

  constructor(config: AgentConfig) {
    this.config = config;
    this.systemPrompt = this.buildSystemPrompt();
  }

  /**
   * Build the system prompt for this agent
   * Must be implemented by child classes
   */
  protected abstract buildSystemPrompt(): string;

  /**
   * Execute the agent's main task
   * Must be implemented by child classes
   */
  public abstract execute(input: any): Promise<AgentResponse>;

  /**
   * Helper: Call Groq API with agent's configuration
   */
  protected async callLLM(
    userPrompt: string,
    additionalContext?: string
  ): Promise<string> {
    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: this.systemPrompt },
      ];

      if (additionalContext) {
        messages.push({ role: 'user', content: additionalContext });
      }

      messages.push({ role: 'user', content: userPrompt });

      logger.debug(`[${this.config.name}] Calling Groq API...`);

      const response = await chatCompletion(messages, {
        model: this.config.model,
        temperature: this.config.temperature ?? 0.7,
        maxTokens: this.config.maxTokens ?? 2048,
      });

      logger.debug(`[${this.config.name}] Received response from Groq API`);

      return response;
    } catch (error) {
      logger.error(`[${this.config.name}] Error calling LLM:`, error);
      throw error;
    }
  }

  /**
   * Helper: Call Groq API and parse JSON response
   */
  protected async callLLMJSON<T = any>(
    userPrompt: string,
    additionalContext?: string
  ): Promise<T> {
    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: this.systemPrompt },
      ];

      if (additionalContext) {
        messages.push({ role: 'user', content: additionalContext });
      }

      messages.push({ role: 'user', content: userPrompt });

      logger.debug(`[${this.config.name}] Calling Groq API for JSON response...`);

      const response = await chatCompletionJSON<T>(messages, {
        model: this.config.model,
        temperature: this.config.temperature ?? 0.3,
        maxTokens: this.config.maxTokens ?? 2048,
      });

      logger.debug(`[${this.config.name}] Parsed JSON response from Groq API`);

      return response;
    } catch (error) {
      logger.error(`[${this.config.name}] Error calling LLM for JSON:`, error);
      throw error;
    }
  }

  /**
   * Helper: Create success response
   */
  protected createSuccessResponse<T>(
    data: T,
    reasoning?: string,
    metadata?: Record<string, any>
  ): AgentResponse<T> {
    return {
      success: true,
      data,
      reasoning,
      metadata,
    };
  }

  /**
   * Helper: Create error response
   */
  protected createErrorResponse(
    error: string,
    metadata?: Record<string, any>
  ): AgentResponse {
    return {
      success: false,
      error,
      metadata,
    };
  }

  /**
   * Get agent information
   */
  public getInfo(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Log agent activity
   */
  protected log(message: string, level: 'info' | 'debug' | 'warn' | 'error' = 'info') {
    const logMessage = `[${this.config.name}] ${message}`;

    switch (level) {
      case 'debug':
        logger.debug(logMessage);
        break;
      case 'warn':
        logger.warn(logMessage);
        break;
      case 'error':
        logger.error(logMessage);
        break;
      default:
        logger.info(logMessage);
    }
  }
}

export default BaseAgent;
