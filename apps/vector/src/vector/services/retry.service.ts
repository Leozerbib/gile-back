import { Injectable } from "@nestjs/common";
import { LoggerClientService } from "@shared/logger";
import { RetryConfig, RetryableError, ApiCallResult } from "../interfaces/error-handling.interface";

@Injectable()
export class RetryService {
  constructor(private readonly logger: LoggerClientService) {}

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(fn: () => Promise<T>, config: RetryConfig, context: string = "unknown"): Promise<ApiCallResult<T>> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      attempts++;

      try {
        const result = await fn();
        const totalDuration = Date.now() - startTime;

        if (attempt > 0) {
          await this.logger.log({
            level: "info",
            service: "vector",
            func: "executeWithRetry",
            message: `Retry succeeded for ${context}`,
            data: { attempts, totalDuration },
          });
        }

        return {
          success: true,
          data: result,
          attempts,
          totalDuration,
        };
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          await this.logger.log({
            level: "error",
            service: "vector",
            func: "executeWithRetry",
            message: `Non-retryable error for ${context}`,
            data: { error: error.message, attempts },
          });
          break;
        }

        // Don't wait after the last attempt
        if (attempt < config.maxRetries) {
          const delay = this.calculateDelay(attempt, config);

          await this.logger.log({
            level: "warn",
            service: "vector",
            func: "executeWithRetry",
            message: `Retry attempt ${attempt + 1}/${config.maxRetries + 1} failed for ${context}`,
            data: {
              error: error.message,
              nextRetryIn: delay,
              attempt: attempt + 1,
            },
          });

          await this.sleep(delay);
        }
      }
    }

    const totalDuration = Date.now() - startTime;

    await this.logger.log({
      level: "error",
      service: "vector",
      func: "executeWithRetry",
      message: `All retry attempts failed for ${context}`,
      data: {
        attempts,
        totalDuration,
        finalError: lastError?.message,
      },
    });

    return {
      success: false,
      error: lastError as RetryableError,
      attempts,
      totalDuration,
    };
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // If error explicitly defines retryability
    if (error.isRetryable !== undefined) {
      return error.isRetryable;
    }

    // Network errors are generally retryable
    if (error.code === "ECONNRESET" || error.code === "ENOTFOUND" || error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      return true;
    }

    // HTTP status codes that are retryable
    if (error.response?.status) {
      const status = error.response.status;
      return (
        status === 429 || // Rate limited
        status === 502 || // Bad Gateway
        status === 503 || // Service Unavailable
        status === 504
      ); // Gateway Timeout
    }

    // Default to non-retryable for unknown errors
    return false;
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = Math.min(config.baseDelay * Math.pow(config.backoffMultiplier, attempt), config.maxDelay);

    if (config.jitter) {
      // Add random jitter (±25% of the delay)
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay = Math.max(0, delay + jitter);
    }

    return Math.floor(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a timeout wrapper for promises
   */
  async withTimeout<T>(promise: Promise<T>, timeoutMs: number, context: string = "operation"): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new RetryableError(`Timeout after ${timeoutMs}ms for ${context}`, true));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }
}
