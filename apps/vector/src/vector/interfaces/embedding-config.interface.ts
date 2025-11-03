export interface EmbeddingConfig {
  provider: "openai" | "google" | "cohere" | "ollama" | "azure";
  apiKey?: string;
  endpoint?: string;
  model: string;
  dimensions?: number;
  maxTokens?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface OpenAIConfig extends EmbeddingConfig {
  provider: "openai";
  model: "text-embedding-ada-002" | "text-embedding-3-small" | "text-embedding-3-large";
  dimensions?: 1536 | 512 | 256;
}

export interface GoogleConfig extends EmbeddingConfig {
  provider: "google";
  model: "text-embedding-004" | "text-embedding-preview-0409";
  dimensions?: 768;
}

export interface CohereConfig extends EmbeddingConfig {
  provider: "cohere";
  model: "embed-english-v3.0" | "embed-multilingual-v3.0";
  dimensions?: 1024;
}

export interface OllamaConfig extends EmbeddingConfig {
  provider: "ollama";
  endpoint: string; // Required for Ollama
  model: string; // Custom model name
}

export interface AzureConfig extends EmbeddingConfig {
  provider: "azure";
  endpoint: string; // Azure endpoint
  deploymentName: string;
  apiVersion?: string;
}
