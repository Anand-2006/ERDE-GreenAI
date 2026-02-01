// Redundant Query Detector - Detects similar queries in session

export interface SimilarityResult {
  isSimilar: boolean;
  similarity: number; // 0-1
  similarPrompt?: string;
  similarPromptId?: string;
}

// Simple token-based similarity (Jaccard similarity)
const calculateSimilarity = (prompt1: string, prompt2: string): number => {
  const tokens1 = new Set(prompt1.toLowerCase().split(/\s+/).filter(t => t.length > 2));
  const tokens2 = new Set(prompt2.toLowerCase().split(/\s+/).filter(t => t.length > 2));
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return intersection.size / union.size;
};

export const detectRedundantQuery = (
  currentPrompt: string,
  previousPrompts: Array<{ id: string; prompt: string }>,
  threshold: number = 0.6
): SimilarityResult => {
  if (previousPrompts.length === 0) {
    return { isSimilar: false, similarity: 0 };
  }

  let maxSimilarity = 0;
  let mostSimilar: { id: string; prompt: string } | null = null;

  for (const prev of previousPrompts) {
    const similarity = calculateSimilarity(currentPrompt, prev.prompt);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      mostSimilar = prev;
    }
  }

  if (maxSimilarity >= threshold && mostSimilar) {
    return {
      isSimilar: true,
      similarity: maxSimilarity,
      similarPrompt: mostSimilar.prompt,
      similarPromptId: mostSimilar.id
    };
  }

  return {
    isSimilar: false,
    similarity: maxSimilarity
  };
};
