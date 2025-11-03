import { Injectable } from "@nestjs/common";
import { LoggerClientService } from "@shared/logger";
import { CircuitBreakerConfig, CircuitBreakerState, CircuitBreakerStats, RetryableError } from "../interfaces/error-handling.interface";

@Injectable()
export class CircuitBreakerService {
  private circuitBreakers = new Map<string, CircuitBreakerStats>();

  constructor(private readonly logger: LoggerClientService) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(key: string, fn: () => Promise<T>, config: CircuitBreakerConfig): Promise<T> {
    const stats = this.getOrCreateStats(key);

    // Check if circuit is open
    if (stats.state === CircuitBreakerState.OPEN) {
      if (Date.now() < (stats.nextAttemptTime?.getTime() || 0)) {
        throw new RetryableError(`Circuit breaker is OPEN for ${key}`);
      }
      // Transition to half-open
      stats.state = CircuitBreakerState.HALF_OPEN;
      await this.logger.log({
        level: "info",
        service: "vector",
        func: "execute",
        message: `Circuit breaker transitioning to HALF_OPEN for ${key}`,
      });
    }

    try {
      const result = await fn();
      this.onSuccess(key, stats, config);
      return result;
    } catch (error) {
      this.onFailure(key, stats, config, error);
      throw error;
    }
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(key: string): CircuitBreakerStats | undefined {
    return this.circuitBreakers.get(key);
  }

  /**
   * Reset circuit breaker for a specific key
   */
  reset(key: string): void {
    const stats = this.circuitBreakers.get(key);
    if (stats) {
      stats.state = CircuitBreakerState.CLOSED;
      stats.failureCount = 0;
      stats.successCount = 0;
      stats.lastFailureTime = undefined;
      stats.nextAttemptTime = undefined;
    }
  }

  private getOrCreateStats(key: string): CircuitBreakerStats {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, {
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        successCount: 0,
      });
    }
    return this.circuitBreakers.get(key)!;
  }

  private onSuccess(key: string, stats: CircuitBreakerStats, config: CircuitBreakerConfig): void {
    stats.successCount++;
    stats.failureCount = 0;

    if (stats.state === CircuitBreakerState.HALF_OPEN) {
      stats.state = CircuitBreakerState.CLOSED;
      this.logger.log({
        level: "info",
        service: "vector",
        func: "onSuccess",
        message: `Circuit breaker closed for ${key}`,
      });
    }
  }

  private onFailure(key: string, stats: CircuitBreakerStats, config: CircuitBreakerConfig, error: any): void {
    stats.failureCount++;
    stats.lastFailureTime = new Date();

    if (stats.failureCount >= config.failureThreshold) {
      stats.state = CircuitBreakerState.OPEN;
      stats.nextAttemptTime = new Date(Date.now() + config.resetTimeout);

      this.logger.log({
        level: "warn",
        service: "vector",
        func: "onFailure",
        message: `Circuit breaker opened for ${key}`,
        data: {
          failureCount: stats.failureCount,
          threshold: config.failureThreshold,
          resetTimeout: config.resetTimeout,
          error: error.message,
        },
      });
    }
  }
}

class RetryableError extends Error {
  constructor(
    message: string,
    public isRetryable: boolean = true,
    public statusCode?: number,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = "RetryableError";
  }
}
