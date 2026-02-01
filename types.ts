export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Research' | 'Extraction' | 'Analysis' | 'Development' | 'Drafting' | 'Logic';
  rating: 'A+' | 'A' | 'B';
  tokens: number;
  savings: number; // percentage
  models: string[]; // e.g., ['gpt4', 'claude']
  prompt: string; // The actual prompt text
}

export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  GALLERY = 'GALLERY',
  ABOUT = 'ABOUT'
}

export interface OptimizationResult {
  originalText: string;
  optimizedText: string;
  originalTokens: number;
  optimizedTokens: number;
  reductionPercentage: number;
  energySaved: string; // e.g., "High"
}

export type AnswerDepth = 'Concise' | 'Standard' | 'Detailed';
export type OptimizationMode = 'Concise' | 'Structured' | 'Deterministic';

export interface OptimizationConfig {
  model: string;
  temperature: number;
  autoPilot: boolean;
  apiKey?: string;
  anticipatoryMode?: boolean; // For anticipatory answer mode
  outputLengthConstraint?: number; // Max tokens for output
  answerDepth: AnswerDepth;
  optimizationMode: OptimizationMode;
}

export interface SavedPrompt {
  id: string;
  originalPrompt: string;
  optimizedPrompt: string;
  timestamp: number;
  reuseCount: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  result: OptimizationResult;
  config: OptimizationConfig;
}