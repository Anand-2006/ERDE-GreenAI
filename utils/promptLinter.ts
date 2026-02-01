// Non-LLM Prompt Linter - Detects issues before LLM calls

export interface LinterIssue {
  type: 'missing_role' | 'missing_format' | 'ambiguous_phrase' | 'multiple_tasks';
  message: string;
  severity: 'warning' | 'info';
}

export const lintPrompt = (prompt: string): LinterIssue[] => {
  const issues: LinterIssue[] = [];
  const lowerPrompt = prompt.toLowerCase();

  // Check for missing role definition
  const rolePatterns = [
    /you are/i,
    /act as/i,
    /role:/i,
    /persona:/i,
    /as a/i,
    /as an/i,
  ];
  const hasRole = rolePatterns.some(pattern => pattern.test(prompt));
  if (!hasRole && prompt.length > 50) {
    issues.push({
      type: 'missing_role',
      message: 'No role definition found (e.g., "You are..."). Consider specifying the AI\'s role.',
      severity: 'warning'
    });
  }

  // Check for missing output format
  const formatPatterns = [
    /bullet/i,
    /list/i,
    /steps/i,
    /code/i,
    /json/i,
    /table/i,
    /format:/i,
    /output:/i,
    /structure:/i,
  ];
  const hasFormat = formatPatterns.some(pattern => pattern.test(prompt));
  if (!hasFormat && prompt.length > 80) {
    issues.push({
      type: 'missing_format',
      message: 'No output format specified. Consider requesting bullets, steps, code, or JSON.',
      severity: 'info'
    });
  }

  // Check for ambiguous phrases
  const ambiguousPhrases = ['some', 'etc', 'things', 'handle', 'appropriate', 'various', 'several', 'many'];
  const foundAmbiguous = ambiguousPhrases.filter(phrase => {
    const regex = new RegExp(`\\b${phrase}\\b`, 'i');
    return regex.test(prompt);
  });
  if (foundAmbiguous.length > 0) {
    issues.push({
      type: 'ambiguous_phrase',
      message: `Ambiguous phrases detected: ${foundAmbiguous.join(', ')}. Consider being more specific.`,
      severity: 'warning'
    });
  }

  // Check for multiple tasks (heuristic: multiple question marks, "and", "also")
  const questionCount = (prompt.match(/\?/g) || []).length;
  const hasMultipleTasks = questionCount > 1 || 
    /\band\b.*\band\b/i.test(prompt) ||
    /\balso\b/i.test(prompt) && prompt.length > 100;
  
  if (hasMultipleTasks) {
    issues.push({
      type: 'multiple_tasks',
      message: 'Multiple tasks detected. Consider splitting into separate prompts for better results.',
      severity: 'warning'
    });
  }

  return issues;
};
