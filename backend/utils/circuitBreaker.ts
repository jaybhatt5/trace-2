/**
 * Resilient Circuit Breaker for TRACE External Upstream Services (Gemini & GNews).
 * Prevents cascading latency when third-party APIs experience downtime or quota exhaustion.
 */

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  recoveryTimeMs?: number;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly threshold: number;
  private readonly recoveryTimeMs: number;
  private readonly name: string;

  constructor(name: string, options?: CircuitBreakerOptions) {
    this.name = name;
    this.threshold = options?.failureThreshold ?? 3;
    this.recoveryTimeMs = options?.recoveryTimeMs ?? 30000; // 30s
  }

  public isOpen(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeMs) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  public recordSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  public recordFailure(err?: any): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      console.warn(
        `[CircuitBreaker: ${this.name}] Breaker TRIPPED to OPEN (${this.failures} consecutive failures). Fast-failing upstream for ${this.recoveryTimeMs / 1000}s.`
      );
    }
  }

  public async execute<T>(fn: () => Promise<T>, fallback: () => Promise<T> | T): Promise<{ result: T; fallbackUsed: boolean; degradedReason?: string }> {
    if (this.isOpen()) {
      return {
        result: await fallback(),
        fallbackUsed: true,
        degradedReason: `Upstream service ${this.name} is currently cooling down due to recent errors.`,
      };
    }

    try {
      const res = await fn();
      this.recordSuccess();
      return { result: res, fallbackUsed: false };
    } catch (err: any) {
      this.recordFailure(err);
      return {
        result: await fallback(),
        fallbackUsed: true,
        degradedReason: `Upstream call to ${this.name} failed (${err?.message || 'timeout/network error'}).`,
      };
    }
  }

  public getStatus() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      isOpen: this.isOpen(),
    };
  }
}

export const geminiCircuitBreaker = new CircuitBreaker('Gemini_AI_Gateway', { failureThreshold: 3, recoveryTimeMs: 25000 });
export const gnewsCircuitBreaker = new CircuitBreaker('GNews_Wire_API', { failureThreshold: 3, recoveryTimeMs: 30000 });
