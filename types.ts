export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Research' | 'Extraction' | 'Analysis' | 'Development' | 'Drafting' | 'Logic';
  rating: 'A+' | 'A' | 'B';
  tokens: number;
  savings: number; // percentage
  models: string[]; // e.g., ['gpt4', 'claude']
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

export interface OptimizationConfig {
  model: string;
  temperature: number;
  autoPilot: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  result: OptimizationResult;
  config: OptimizationConfig;
}