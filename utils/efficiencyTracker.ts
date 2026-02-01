// Efficiency Tracker - Tracks session-level efficiency metrics

export interface SessionMetrics {
  llmCalls: number;
  retries: number;
  estimatedTokens: number;
  savedPrompts: number;
  reusedPrompts: number;
}

export class EfficiencyTracker {
  private metrics: SessionMetrics = {
    llmCalls: 0,
    retries: 0,
    estimatedTokens: 0,
    savedPrompts: 0,
    reusedPrompts: 0
  };

  recordLLMCall(estimatedTokens: number) {
    this.metrics.llmCalls++;
    this.metrics.estimatedTokens += estimatedTokens;
  }

  recordRetry() {
    this.metrics.retries++;
  }

  recordSavedPrompt() {
    this.metrics.savedPrompts++;
  }

  recordReusedPrompt() {
    this.metrics.reusedPrompts++;
  }

  getMetrics(): SessionMetrics {
    return { ...this.metrics };
  }

  getEfficiencyScore(): number {
    // Simple efficiency score: lower retries and reused prompts = higher efficiency
    const retryPenalty = this.metrics.retries * 10;
    const reuseBonus = this.metrics.reusedPrompts * 5;
    const baseScore = 100;
    
    return Math.max(0, Math.min(100, baseScore - retryPenalty + reuseBonus));
  }

  reset() {
    this.metrics = {
      llmCalls: 0,
      retries: 0,
      estimatedTokens: 0,
      savedPrompts: 0,
      reusedPrompts: 0
    };
  }
}

// Singleton instance
export const efficiencyTracker = new EfficiencyTracker();
