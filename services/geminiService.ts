import { OptimizationConfig } from "../types";
import { getOutputLengthConstraint } from "../utils/outputLengthGuard";

const API_BASE_URL = 'http://localhost:3001/api';

export const optimizePrompt = async (promptText: string, config: OptimizationConfig): Promise<any> => {
  try {
    // 1. Infer constraints (Answer Depth + Task Type)
    const constraint = getOutputLengthConstraint(promptText, config.answerDepth);

    // 2. Prepare optimization instructions to inject
    let instructions = `\n[EFFICIENCY_TARGET]: ${config.answerDepth}\n[CONSTRAINTS]: ${constraint.guidance}`;

    if (config.optimizationMode === 'Deterministic') {
      instructions += `\n[MODE]: Deterministic. Use explicit rules, minimal interpretation, and improve determinism.`;
    } else if (config.optimizationMode === 'Structured') {
      instructions += `\n[MODE]: Structured. Organize with clear sections and bounded categories.`;
    } else {
      instructions += `\n[MODE]: Concise. Aggressively limit output tokens and remove redundancy.`;
    }

    if (config.anticipatoryMode) {
      instructions += `\n[ANTICIPATORY]: Enabled. Structure response with: Answer, Assumptions, Likely Follow-ups (collapsed), and Next Steps.`;
    }

    // Combine for optimization
    const processedPrompt = `${promptText}\n\nREQUIRED SYSTEM CONSTRAINTS TO INJECT DURING OPTIMIZATION:${instructions}`;

    const response = await fetch(`${API_BASE_URL}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: processedPrompt, config }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      if (text.includes("<!DOCTYPE") || text.includes("<html")) {
        throw new Error("Backend Server Error: The server crashed or returned an invalid response. Please check terminal logs.");
      }
      throw new Error(text || 'Unknown server error');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to optimize prompt');
    }

    return data;
  } catch (error: any) {
    console.error("Gemini optimization service failed:", error);
    // Propagate the actual server message if available
    throw new Error(error.message || "Optimization service unreachable. Is the backend server running?");
  }
};

export const registerUser = async (email: string, password: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Registration failed');
  }

  return await response.json();
};

export const loginUser = async (email: string, password: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }

  return await response.json();
};