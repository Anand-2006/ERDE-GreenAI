import { GoogleGenAI, Type } from "@google/genai";
import { OptimizationConfig } from "../types";

export const optimizePrompt = async (promptText: string, config: OptimizationConfig): Promise<any> => {
  // The API key is loaded from the environment variable process.env.API_KEY.
  const apiKey = process.env.API_KEY;
  
  // Check if key is missing and log a warning as requested
  if (!apiKey || apiKey.trim() === '') {
    console.warn("Verdant-Route: No API_KEY found in environment variables. Please add it to your .env file.");
    throw new Error("Missing API Key. Please configure process.env.API_KEY to use the optimization engine.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Select model based on config or auto-pilot logic
  let selectedModel = config.model;
  
  if (config.autoPilot) {
    // Heuristic: long prompts (>500 chars) use Pro for reasoning, short use Flash for speed/efficiency
    selectedModel = promptText.length > 500 ? "gemini-3-pro-preview" : "gemini-3-flash-preview";
  }

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: `You are an expert AI prompt engineer and carbon-efficiency specialist.
      Optimize the following prompt to reduce token usage while maintaining semantic intent.
      Remove conversational filler, use imperative verbs, and condense structure.
      
      Prompt to optimize:
      "${promptText}"`,
      config: {
        temperature: config.temperature,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimizedText: { type: Type.STRING },
            originalTokens: { type: Type.NUMBER },
            optimizedTokens: { type: Type.NUMBER },
            reductionPercentage: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");

    const data = JSON.parse(text);
    
    // Post-process to determine energy rating
    const energySaved = data.reductionPercentage > 25 ? "High (Green)" : "Moderate";

    return {
      ...data,
      energySaved
    };

  } catch (error) {
    console.error("Gemini optimization service failed:", error);
    throw error;
  }
};