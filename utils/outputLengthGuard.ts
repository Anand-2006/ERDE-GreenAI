// Output Length Guard - Infers task type and sets output length constraints

import { AnswerDepth } from '../types';

export type TaskType = 'summary' | 'explanation' | 'code' | 'analysis' | 'list' | 'unknown';

export interface OutputLengthConstraint {
  taskType: TaskType;
  maxTokens: number;
  guidance: string;
}

export const inferTaskType = (prompt: string): TaskType => {
  const lowerPrompt = prompt.toLowerCase();

  // Code generation
  if (/\b(code|function|script|program|implement|write code|generate code|create.*code)\b/.test(lowerPrompt)) {
    return 'code';
  }

  // Summary
  if (/\b(summarize|summary|brief|overview|tl;dr|tl;dr|condense)\b/.test(lowerPrompt)) {
    return 'summary';
  }

  // List
  if (/\b(list|enumerate|items|bullets|points|steps)\b/.test(lowerPrompt)) {
    return 'list';
  }

  // Analysis
  if (/\b(analyze|analysis|evaluate|assess|compare|contrast|examine)\b/.test(lowerPrompt)) {
    return 'analysis';
  }

  // Explanation
  if (/\b(explain|describe|how|why|what is|tell me about)\b/.test(lowerPrompt)) {
    return 'explanation';
  }

  return 'unknown';
};

export const getOutputLengthConstraint = (prompt: string, depth: AnswerDepth = 'Concise'): OutputLengthConstraint => {
  const taskType = inferTaskType(prompt);
  let maxTokens = 400;
  let guidance = '';

  const depthFactor = depth === 'Concise' ? 0.5 : depth === 'Detailed' ? 2 : 1;

  switch (taskType) {
    case 'summary':
      maxTokens = 150 * depthFactor;
      guidance = depth === 'Concise'
        ? 'One paragraph, max 50 words. Absolute focus on core essence.'
        : 'Structured overview with key highlights.';
      break;

    case 'code':
      maxTokens = 400 * depthFactor;
      guidance = depth === 'Concise'
        ? 'Pure code block only. No comments or preamble.'
        : 'Code with essential documentation and usage example.';
      break;

    case 'list':
      const maxBullets = depth === 'Concise' ? 5 : depth === 'Detailed' ? 15 : 10;
      maxTokens = 250 * depthFactor;
      guidance = `Max ${maxBullets} bullet points. ${depth === 'Concise' ? 'Strict limit of 20 words per bullet.' : ''}`;
      break;

    case 'explanation':
      maxTokens = 300 * depthFactor;
      guidance = depth === 'Concise'
        ? 'Max 2 paragraphs, max 100 words total. Use direct language.'
        : 'Structured explanation with definitions and context.';
      break;

    case 'analysis':
      maxTokens = 450 * depthFactor;
      guidance = depth === 'Concise'
        ? 'Direct findings and recommendations. Minimal background.'
        : 'Comprehensive analysis with data points and multi-angle evaluation.';
      break;

    default:
      maxTokens = 300 * depthFactor;
      guidance = 'Focused response with minimal conversational filler.';
  }

  // Final Word/Bullet caps for Concise
  if (depth === 'Concise') {
    if (taskType === 'explanation' || taskType === 'summary') {
      guidance += ' ENFORCE: max 100 words.';
    }
  }

  return {
    taskType,
    maxTokens: Math.round(maxTokens),
    guidance
  };
};
