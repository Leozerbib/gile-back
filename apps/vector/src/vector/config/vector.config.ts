import { Injectable } from "@nestjs/common";
import { EmbeddingProvider, EmbeddingConfig, OpenAIConfig, GoogleConfig, CohereConfig, OllamaConfig, AzureConfig } from "../interfaces/embedding-config.interface";
import { ErrorHandlingConfig, RetryConfig, CircuitBreakerConfig } from "../interfaces/error-handling.interface";

export interface VectorServiceConfig {
  embedding: EmbeddingConfig;
  errorHandling: ErrorHandlingConfig;
  database: {
    batchSize: number;
    maxConcurrentOperations: number;
    searchLimit: number;
  };
  monitoring: {
    enableMetrics: boolean;
    metricsInterval: number;
    logLevel: string;
  };
}

@Injectable()
export class VectorConfigService {
  private config: VectorServiceConfig;

  constructor() {
    this.loadConfiguration();
    this.validateConfiguration();
  }

  /**
   * Get the complete vector service configuration
   */
  getConfig(): VectorServiceConfig {
    return { ...this.config };
  }

  /**
   * Get embedding configuration
   */
  getEmbeddingConfig(): EmbeddingConfig {
    return { ...this.config.embedding };
  }

  /**
   * Get error handling configuration
   */
  getErrorHandlingConfig(): ErrorHandlingConfig {
    return { ...this.config.errorHandling };
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return { ...this.config.database };
  }

  /**
   * Get monitoring configuration
   */
  getMonitoringConfig() {
    return { ...this.config.monitoring };
  }

  /**
   * Update embedding provider configuration
   */
  updateEmbeddingConfig(config: Partial<EmbeddingConfig>): void {
    this.config.embedding = { ...this.config.embedding, ...config };
    this.validateEmbeddingConfig();
  }

  /**
   * Update error handling configuration
   */
  updateErrorHandlingConfig(config: Partial<ErrorHandlingConfig>): void {
    this.config.errorHandling = { ...this.config.errorHandling, ...config };
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfiguration(): void {
    this.config = {
      embedding: this.loadEmbeddingConfig(),
      errorHandling: this.loadErrorHandlingConfig(),
      database: this.loadDatabaseConfig(),
      monitoring: this.loadMonitoringConfig(),
    };
  }

  /**
   * Load embedding configuration
   */
  private loadEmbeddingConfig(): EmbeddingConfig {
    const provider = (process.env.EMBEDDING_PROVIDER || "openai") as EmbeddingProvider;

    switch (provider) {
      case EmbeddingProvider.OPENAI:
        return {
          provider,
          config: {
            apiKey: process.env.OPENAI_API_KEY!,
            model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
            dimensions: parseInt(process.env.OPENAI_EMBEDDING_DIMENSIONS || "1536"),
          } as OpenAIConfig,
        };

      case EmbeddingProvider.GOOGLE:
        return {
          provider,
          config: {
            apiKey: process.env.GOOGLE_API_KEY!,
            model: process.env.GOOGLE_EMBEDDING_MODEL || "models/text-embedding-004",
            dimensions: parseInt(process.env.GOOGLE_EMBEDDING_DIMENSIONS || "768"),
          } as GoogleConfig,
        };

      case EmbeddingProvider.COHERE:
        return {
          provider,
          config: {
            apiKey: process.env.COHERE_API_KEY!,
            model: process.env.COHERE_EMBEDDING_MODEL || "embed-english-v3.0",
            inputType: (process.env.COHERE_INPUT_TYPE as any) || "search_document",
            dimensions: parseInt(process.env.COHERE_EMBEDDING_DIMENSIONS || "1024"),
          } as CohereConfig,
        };

      case EmbeddingProvider.OLLAMA:
        return {
          provider,
          config: {
            baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
            model: process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text",
            dimensions: parseInt(process.env.OLLAMA_EMBEDDING_DIMENSIONS || "768"),
          } as OllamaConfig,
        };

      case EmbeddingProvider.AZURE:
        return {
          provider,
          config: {
            apiKey: process.env.AZURE_OPENAI_API_KEY!,
            endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
            deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-01",
            dimensions: parseInt(process.env.AZURE_EMBEDDING_DIMENSIONS || "1536"),
          } as AzureConfig,
        };

      default:
        throw new Error(`Unsupported embedding provider: ${provider}`);
    }
  }

  /**
   * Load error handling configuration
   */
  private loadErrorHandlingConfig(): ErrorHandlingConfig {
    return {
      retry: {
        maxRetries: parseInt(process.env.EMBEDDING_MAX_RETRIES || "3"),
        baseDelay: parseInt(process.env.EMBEDDING_BASE_DELAY || "1000"),
        maxDelay: parseInt(process.env.EMBEDDING_MAX_DELAY || "30000"),
        backoffMultiplier: parseFloat(process.env.EMBEDDING_BACKOFF_MULTIPLIER || "2"),
        jitter: process.env.EMBEDDING_JITTER !== "false",
      },
      circuitBreaker: {
        failureThreshold: parseInt(process.env.EMBEDDING_FAILURE_THRESHOLD || "5"),
        resetTimeout: parseInt(process.env.EMBEDDING_RESET_TIMEOUT || "60000"),
        monitoringPeriod: parseInt(process.env.EMBEDDING_MONITORING_PERIOD || "60000"),
      },
      timeoutMs: parseInt(process.env.EMBEDDING_TIMEOUT_MS || "30000"),
    };
  }

  /**
   * Load database configuration
   */
  private loadDatabaseConfig() {
    return {
      batchSize: parseInt(process.env.VECTOR_DB_BATCH_SIZE || "100"),
      maxConcurrentOperations: parseInt(process.env.VECTOR_DB_MAX_CONCURRENT || "10"),
      searchLimit: parseInt(process.env.VECTOR_DB_SEARCH_LIMIT || "50"),
    };
  }

  /**
   * Load monitoring configuration
   */
  private loadMonitoringConfig() {
    return {
      enableMetrics: process.env.VECTOR_ENABLE_METRICS !== "false",
      metricsInterval: parseInt(process.env.VECTOR_METRICS_INTERVAL || "60000"),
      logLevel: process.env.VECTOR_LOG_LEVEL || "info",
    };
  }

  /**
   * Validate the complete configuration
   */
  private validateConfiguration(): void {
    this.validateEmbeddingConfig();
    this.validateErrorHandlingConfig();
    this.validateDatabaseConfig();
    this.validateMonitoringConfig();
  }

  /**
   * Validate embedding configuration
   */
  private validateEmbeddingConfig(): void {
    if (!this.config.embedding.config) {
      throw new Error("Embedding configuration is missing");
    }

    switch (this.config.embedding.provider) {
      case EmbeddingProvider.OPENAI:
        const openaiConfig = this.config.embedding.config as OpenAIConfig;
        if (!openaiConfig.apiKey) {
          throw new Error("OpenAI API key is required (OPENAI_API_KEY)");
        }
        if (!openaiConfig.model) {
          throw new Error("OpenAI model is required");
        }
        break;

      case EmbeddingProvider.GOOGLE:
        const googleConfig = this.config.embedding.config as GoogleConfig;
        if (!googleConfig.apiKey) {
          throw new Error("Google API key is required (GOOGLE_API_KEY)");
        }
        if (!googleConfig.model) {
          throw new Error("Google model is required");
        }
        break;

      case EmbeddingProvider.COHERE:
        const cohereConfig = this.config.embedding.config as CohereConfig;
        if (!cohereConfig.apiKey) {
          throw new Error("Cohere API key is required (COHERE_API_KEY)");
        }
        if (!cohereConfig.model) {
          throw new Error("Cohere model is required");
        }
        break;

      case EmbeddingProvider.OLLAMA:
        const ollamaConfig = this.config.embedding.config as OllamaConfig;
        if (!ollamaConfig.baseUrl) {
          throw new Error("Ollama base URL is required");
        }
        if (!ollamaConfig.model) {
          throw new Error("Ollama model is required");
        }
        break;

      case EmbeddingProvider.AZURE:
        const azureConfig = this.config.embedding.config as AzureConfig;
        if (!azureConfig.apiKey) {
          throw new Error("Azure OpenAI API key is required (AZURE_OPENAI_API_KEY)");
        }
        if (!azureConfig.endpoint) {
          throw new Error("Azure OpenAI endpoint is required (AZURE_OPENAI_ENDPOINT)");
        }
        if (!azureConfig.deploymentName) {
          throw new Error("Azure OpenAI deployment name is required (AZURE_OPENAI_DEPLOYMENT_NAME)");
        }
        break;

      default:
        throw new Error(`Unsupported embedding provider: ${this.config.embedding.provider}`);
    }
  }

  /**
   * Validate error handling configuration
   */
  private validateErrorHandlingConfig(): void {
    const { retry, circuitBreaker, timeoutMs } = this.config.errorHandling;

    if (retry.maxRetries < 0 || retry.maxRetries > 10) {
      throw new Error("Max retries must be between 0 and 10");
    }

    if (retry.baseDelay < 100 || retry.baseDelay > 10000) {
      throw new Error("Base delay must be between 100ms and 10s");
    }

    if (retry.maxDelay < retry.baseDelay) {
      throw new Error("Max delay must be greater than base delay");
    }

    if (retry.backoffMultiplier < 1 || retry.backoffMultiplier > 5) {
      throw new Error("Backoff multiplier must be between 1 and 5");
    }

    if (circuitBreaker.failureThreshold < 1 || circuitBreaker.failureThreshold > 20) {
      throw new Error("Circuit breaker failure threshold must be between 1 and 20");
    }

    if (circuitBreaker.resetTimeout < 1000 || circuitBreaker.resetTimeout > 300000) {
      throw new Error("Circuit breaker reset timeout must be between 1s and 5min");
    }

    if (timeoutMs < 1000 || timeoutMs > 120000) {
      throw new Error("Timeout must be between 1s and 2min");
    }
  }

  /**
   * Validate database configuration
   */
  private validateDatabaseConfig(): void {
    const { batchSize, maxConcurrentOperations, searchLimit } = this.config.database;

    if (batchSize < 1 || batchSize > 1000) {
      throw new Error("Batch size must be between 1 and 1000");
    }

    if (maxConcurrentOperations < 1 || maxConcurrentOperations > 50) {
      throw new Error("Max concurrent operations must be between 1 and 50");
    }

    if (searchLimit < 1 || searchLimit > 500) {
      throw new Error("Search limit must be between 1 and 500");
    }
  }

  /**
   * Validate monitoring configuration
   */
  private validateMonitoringConfig(): void {
    const { metricsInterval, logLevel } = this.config.monitoring;

    if (metricsInterval < 10000 || metricsInterval > 600000) {
      throw new Error("Metrics interval must be between 10s and 10min");
    }

    const validLogLevels = ["debug", "info", "warn", "error", "fatal"];
    if (!validLogLevels.includes(logLevel)) {
      throw new Error(`Log level must be one of: ${validLogLevels.join(", ")}`);
    }
  }

  /**
   * Get environment-specific configuration summary
   */
  getConfigSummary(): Record<string, any> {
    return {
      embedding: {
        provider: this.config.embedding.provider,
        model: (this.config.embedding.config as any)?.model,
        dimensions: (this.config.embedding.config as any)?.dimensions,
      },
      errorHandling: {
        maxRetries: this.config.errorHandling.retry.maxRetries,
        timeoutMs: this.config.errorHandling.timeoutMs,
        failureThreshold: this.config.errorHandling.circuitBreaker.failureThreshold,
      },
      database: this.config.database,
      monitoring: this.config.monitoring,
    };
  }
}
