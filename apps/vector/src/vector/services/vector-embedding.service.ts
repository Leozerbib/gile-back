import { Injectable } from "@nestjs/common";
import { LoggerClientService } from "@shared/logger";
import { EmbeddingProvider, EmbeddingConfig, OpenAIConfig, GoogleConfig, CohereConfig, OllamaConfig, AzureConfig } from "../interfaces/embedding-config.interface";
import { RetryableError, ApiCallResult } from "../interfaces/error-handling.interface";
import { RetryService } from "./retry.service";
import { CircuitBreakerService } from "./circuit-breaker.service";
import { VectorConfigService } from "../config/vector.config";
import { MonitoringService } from "./monitoring.service";

@Injectable()
export class VectorEmbeddingService {
  private config: EmbeddingConfig;

  constructor(
    private readonly logger: LoggerClientService,
    private readonly retryService: RetryService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly configService: VectorConfigService,
    private readonly monitoringService: MonitoringService,
  ) {
    this.config = this.configService.getEmbeddingConfig();
  }

  /**
   * Generate embeddings for the given text using the configured provider
   */
  async generateEmbedding(text: string, entityType?: "project" | "ticket" | "epic" | "task" | "sprint", entityId?: string, workspaceId?: string): Promise<number[]> {
    const startTime = Date.now();
    const errorHandlingConfig = this.configService.getErrorHandlingConfig();

    try {
      const result = await this.circuitBreakerService.execute(async () => {
        return this.retryService.executeWithRetry(() => this.callEmbeddingAPI(text), errorHandlingConfig.retry);
      });

      const duration = Date.now() - startTime;
      const embeddingConfig = this.config.config as any;

      // Record successful embedding metric
      await this.monitoringService.recordEmbeddingMetric(
        this.config.provider,
        embeddingConfig.model || "unknown",
        text.length,
        duration,
        true,
        result.length,
        1, // attempts would come from retry service
        "closed", // would come from circuit breaker service
        undefined,
        undefined,
        entityType,
        entityId,
        workspaceId,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const embeddingConfig = this.config.config as any;

      // Record failed embedding metric
      await this.monitoringService.recordEmbeddingMetric(
        this.config.provider,
        embeddingConfig.model || "unknown",
        text.length,
        duration,
        false,
        undefined,
        1, // attempts would come from retry service
        "open", // would come from circuit breaker service
        error.constructor.name,
        error.message,
        entityType,
        entityId,
        workspaceId,
      );

      throw error;
    }
  }

  /**
   * Call the appropriate embedding API based on provider
   */
  private async callEmbeddingAPI(text: string): Promise<number[]> {
    switch (this.config.provider) {
      case EmbeddingProvider.OPENAI:
        return this.callOpenAI(text, this.config.config as OpenAIConfig);
      case EmbeddingProvider.GOOGLE:
        return this.callGoogle(text, this.config.config as GoogleConfig);
      case EmbeddingProvider.COHERE:
        return this.callCohere(text, this.config.config as CohereConfig);
      case EmbeddingProvider.OLLAMA:
        return this.callOllama(text, this.config.config as OllamaConfig);
      case EmbeddingProvider.AZURE:
        return this.callAzure(text, this.config.config as AzureConfig);
      default:
        throw new RetryableError(`Unsupported embedding provider: ${this.config.provider}`, false);
    }
  }

  /**
   * Call OpenAI embedding API
   */
  private async callOpenAI(text: string, config: OpenAIConfig): Promise<number[]> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        model: config.model,
        encoding_format: "float",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new RetryableError(
        `OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`,
        response.status >= 500 || response.status === 429,
        response.status,
      );
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Call Google embedding API
   */
  private async callGoogle(text: string, config: GoogleConfig): Promise<number[]> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:embedContent?key=${config.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new RetryableError(
        `Google API error: ${response.status} - ${errorData.error?.message || response.statusText}`,
        response.status >= 500 || response.status === 429,
        response.status,
      );
    }

    const data = await response.json();
    return data.embedding.values;
  }

  /**
   * Call Cohere embedding API
   */
  private async callCohere(text: string, config: CohereConfig): Promise<number[]> {
    const response = await fetch("https://api.cohere.ai/v1/embed", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texts: [text],
        model: config.model,
        input_type: config.inputType || "search_document",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new RetryableError(
        `Cohere API error: ${response.status} - ${errorData.message || response.statusText}`,
        response.status >= 500 || response.status === 429,
        response.status,
      );
    }

    const data = await response.json();
    return data.embeddings[0];
  }

  /**
   * Call Ollama embedding API
   */
  private async callOllama(text: string, config: OllamaConfig): Promise<number[]> {
    const response = await fetch(`${config.baseUrl}/api/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new RetryableError(
        `Ollama API error: ${response.status} - ${errorData.error || response.statusText}`,
        response.status >= 500 || response.status === 429,
        response.status,
      );
    }

    const data = await response.json();
    return data.embedding;
  }

  /**
   * Call Azure OpenAI embedding API
   */
  private async callAzure(text: string, config: AzureConfig): Promise<number[]> {
    const response = await fetch(`${config.endpoint}/openai/deployments/${config.deploymentName}/embeddings?api-version=${config.apiVersion}`, {
      method: "POST",
      headers: {
        "api-key": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new RetryableError(
        `Azure OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`,
        response.status >= 500 || response.status === 429,
        response.status,
      );
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Get current configuration
   */
  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }

  /**
   * Get circuit breaker stats
   */
  getCircuitBreakerStats() {
    return this.circuitBreakerService.getStats();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreakerService.reset();
  }
}
