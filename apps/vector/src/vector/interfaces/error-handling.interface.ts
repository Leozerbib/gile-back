export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number; // milliseconds
  monitoringPeriod: number; // milliseconds
}

export interface ErrorHandlingConfig {
  retry: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
  timeoutMs: number;
}

export enum CircuitBreakerState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

export interface RetryableError extends Error {
  isRetryable: boolean;
  statusCode?: number;
  retryAfter?: number;
}

export interface ApiCallResult<T> {
  success: boolean;
  data?: T;
  error?: RetryableError;
  attempts: number;
  totalDuration: number;
}
