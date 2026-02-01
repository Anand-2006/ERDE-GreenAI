// Prompt Storage - Local storage for saved prompts

export interface SavedPrompt {
  id: string;
  prompt: string;
  optimizedPrompt?: string;
  createdAt: number;
  lastUsed: number;
  useCount: number;
  tags?: string[];
}

const STORAGE_KEY = 'erde_saved_prompts';

export const savePrompt = (prompt: string, optimizedPrompt?: string, tags?: string[]): SavedPrompt => {
  const savedPrompts = getSavedPrompts();
  const newPrompt: SavedPrompt = {
    id: crypto.randomUUID(),
    prompt,
    optimizedPrompt,
    createdAt: Date.now(),
    lastUsed: Date.now(),
    useCount: 0,
    tags
  };
  
  savedPrompts.push(newPrompt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPrompts));
  return newPrompt;
};

export const getSavedPrompts = (): SavedPrompt[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const updatePromptUsage = (id: string) => {
  const savedPrompts = getSavedPrompts();
  const prompt = savedPrompts.find(p => p.id === id);
  if (prompt) {
    prompt.lastUsed = Date.now();
    prompt.useCount++;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPrompts));
  }
};

export const deleteSavedPrompt = (id: string) => {
  const savedPrompts = getSavedPrompts().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPrompts));
};

export const searchSavedPrompts = (query: string): SavedPrompt[] => {
  const savedPrompts = getSavedPrompts();
  const lowerQuery = query.toLowerCase();
  
  return savedPrompts.filter(p => 
    p.prompt.toLowerCase().includes(lowerQuery) ||
    p.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};
