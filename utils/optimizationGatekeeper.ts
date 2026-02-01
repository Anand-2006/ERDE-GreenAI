// Optimization Gatekeeper - Decides if optimization should be recommended

import { LinterIssue } from './promptLinter';

export interface GatekeeperDecision {
  shouldRecommend: boolean;
  reason: string;
  isBlocked: boolean;
}

export const shouldRecommendOptimization = (prompt: string, issues: LinterIssue[] = []): GatekeeperDecision => {
  const trimmedPrompt = prompt.trim();

  // Rule 0: Blocked by major linting issues
  const majorIssues = issues.filter(issue => issue.severity === 'warning');
  if (majorIssues.length > 1) {
    return {
      shouldRecommend: false,
      isBlocked: true,
      reason: `Optimization blocked until prompt quality issues are resolved (${majorIssues.length} warnings detected).`
    };
  }

  // Rule 1: Very short prompts (< 120 chars)
  if (trimmedPrompt.length < 120) {
    return {
      shouldRecommend: false,
      isBlocked: false,
      reason: 'Prompt is too short for optimization to provide significant benefit.'
    };
  }

  // Rule 2: One-off factual queries
  const factualPatterns = [
    /^what is/i,
    /^who is/i,
    /^when did/i,
    /^where is/i,
    /^how many/i,
    /^what year/i,
  ];
  if (factualPatterns.some(pattern => pattern.test(trimmedPrompt)) && trimmedPrompt.length < 200) {
    return {
      shouldRecommend: false,
      isBlocked: false,
      reason: 'This appears to be a simple factual query that may not benefit from optimization.'
    };
  }

  // Rule 3: Already optimized
  const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'kind of'];
  const hasFiller = fillerWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(trimmedPrompt);
  });

  const words = trimmedPrompt.split(/\s+/).filter(w => w.length > 0);
  const avgWordLength = words.length > 0 ? words.reduce((sum, word) => sum + word.length, 0) / words.length : 0;

  if (!hasFiller && avgWordLength > 5 && trimmedPrompt.length < 300) {
    return {
      shouldRecommend: false,
      isBlocked: false,
      reason: 'Prompt appears already optimized (concise and specific).'
    };
  }

  return {
    shouldRecommend: true,
    isBlocked: false,
    reason: 'Optimization recommended for this prompt.'
  };
};
