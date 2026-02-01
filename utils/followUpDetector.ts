// Follow-up Likelihood Detection - Detects prompts likely to cause clarification follow-ups

export interface FollowUpDetection {
  likelyFollowUp: boolean;
  confidence: 'high' | 'medium' | 'low';
  triggers: string[];
}

export const detectFollowUpLikelihood = (prompt: string): FollowUpDetection => {
  const lowerPrompt = prompt.toLowerCase();
  const triggers: string[] = [];
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // High-confidence triggers
  const highConfidenceWords = ['how', 'why', 'explain', 'compare', 'difference', 'trade-off', 'tradeoff', 'pros', 'cons'];
  const foundHigh = highConfidenceWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(prompt);
  });
  
  if (foundHigh.length > 0) {
    triggers.push(...foundHigh);
    confidence = 'high';
  }

  // Medium-confidence: conceptual but lacks constraints
  const conceptualWords = ['understand', 'concept', 'idea', 'theory', 'principle'];
  const hasConceptual = conceptualWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(prompt);
  });
  
  const hasConstraints = /\b(limit|constraint|specific|exact|precise|only|just)\b/i.test(prompt);
  
  if (hasConceptual && !hasConstraints && prompt.length < 150) {
    triggers.push('conceptual_without_constraints');
    if (confidence === 'low') confidence = 'medium';
  }

  // Medium-confidence: short but open-ended
  if (prompt.length < 100 && /\?$/.test(prompt) && !/\b(yes|no|true|false|specific|exact)\b/i.test(prompt)) {
    triggers.push('short_open_ended');
    if (confidence === 'low') confidence = 'medium';
  }

  return {
    likelyFollowUp: triggers.length > 0,
    confidence,
    triggers
  };
};
