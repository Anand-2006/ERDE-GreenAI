import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from "@google/genai";
import { OptimizationConfig } from '../types';

import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadedEnv = dotenv.config({ path: '.env.local' });
console.log("ENV Load Result:", loadedEnv.error ? "Error" : "Success");
console.log("API Key present in env:", !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
    console.log("API Key length:", process.env.GEMINI_API_KEY.length);
    console.log("API Key starts with:", process.env.GEMINI_API_KEY.substring(0, 5));
} else {
    console.log("WARNING: No API Key found in process.env");
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- DATABASE SIMULATION (On Server) ---
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

const getUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
const saveUsers = (users: any[]) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

// --- GEMINI SERVICE ---
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is missing in .env.local");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// --- ROUTES ---

// 1. Auth: Register
app.post('/api/auth/register', (req, res) => {
    try {
        const { email, password } = req.body;
        const users = getUsers();
        if (users.find((u: any) => u.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const newUser = { email, password, createdAt: Date.now() };
        users.push(newUser);
        saveUsers(users);
        res.json({ success: true, user: { email: newUser.email } });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Auth: Login
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const users = getUsers();
        const user = users.find((u: any) => u.email === email && u.password === password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ success: true, user: { email: user.email } });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Optimize Prompt
// 3. Optimize Prompt
app.post('/api/optimize', async (req, res) => {
    try {
        const { prompt, config } = req.body as { prompt: string, config: OptimizationConfig };

        // 1. Dynamic API Key Logic: Prefer User's Key > Server Env Key
        const runtimeKey = config.apiKey || process.env.GEMINI_API_KEY;

        if (!runtimeKey) {
            return res.status(500).json({ error: 'Gemini API Key missing. Please configure it in Settings.' });
        }

        // Initialize client with the specific key for this request
        const dynamicAi = new GoogleGenAI({ apiKey: runtimeKey });

        // 2. Model Mapping (Verified from API)
        const MODEL_MAP: Record<string, string> = {
            'gemini-3-pro-preview': 'gemini-3-pro-preview', // Precise match
            'gemini-3-flash-preview': 'gemini-3-flash-preview',
            'gemini-2.5-flash-latest': 'gemini-2.5-flash',
            'gemini-1.5-flash': 'gemini-2.0-flash', // Fallback to 2.0 as 1.5 is missing
            'gemini-1.5-pro': 'gemini-2.5-pro'
        };

        // Default to a model we KNOW exists
        let selectedModel = MODEL_MAP[config.model] || 'gemini-2.0-flash';

        if (config.autoPilot) {
            selectedModel = prompt.length > 3000 ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
        }

        const generate = async (model: string) => {
            return await dynamicAi.models.generateContent({
                model: model,
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: `You are an expert AI prompt engineer. Optimize this prompt to be concise and token-efficient while preserving intent:\n\n${prompt}` }]
                    }
                ],
                config: {
                    temperature: config.temperature,
                    maxOutputTokens: config.outputLengthConstraint,
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
        };

        // List of models to try in order of preference (Rotation Strategy)
        // We prioritize newer/lighter models which might have separate quota buckets
        const CANDIDATE_MODELS = [
            selectedModel,             // Try requested model first
            'gemini-2.5-flash',        // Latest Flash (High Perf)
            'gemini-2.0-flash-lite',   // Lite (Often better availability)
            'gemini-2.0-flash',        // Standard Flash
            'gemini-exp-1206'          // Experimental (last resort)
        ];

        // Remove duplicates
        const uniqueCandidates = [...new Set(CANDIDATE_MODELS)];

        let response;
        let successfulModel = '';
        let lastError;

        console.log(`Starting optimization sequence for candidates: ${uniqueCandidates.join(', ')}`);

        for (const model of uniqueCandidates) {
            try {
                console.log(`Attempting generation with: ${model}`);
                response = await generate(model);
                if (response && response.text) {
                    successfulModel = model;
                    console.log(`Success with ${model}`);
                    break; // Exit loop on success
                }
            } catch (err: any) {
                console.warn(`Model ${model} failed: ${err.message.substring(0, 100)}...`);
                lastError = err;

                // If it's a 429 (Quota) or 404 (Not Found), we continue to next candidate.
                // If it's a content safety policy block, we might want to stop, but for now continue.
                continue;
            }
        }

        if (!response) {
            // If all failed, throw the last error or a generic one
            throw new Error(lastError?.message || "All available models failed to generate a response. Please check your API quota.");
        }

        // Fix: Handle both SDK versions (.text() method vs .text property)
        let rawText = typeof response.text === 'function' ? response.text() : response.text;

        if (!rawText && response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
            // Deep fallback for raw candidate access
            rawText = response.candidates[0].content.parts[0].text;
        }

        rawText = rawText || "{}";
        let data;

        try {
            // Attempt 1: Direct Parse
            data = JSON.parse(rawText);
        } catch (e) {
            // Attempt 2: Clean Markdown (```json ... ```)
            const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/) || rawText.match(/```([\s\S]*?)```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    data = JSON.parse(jsonMatch[1]);
                } catch (e2) {
                    console.warn("Failed to parse extracted JSON block");
                }
            }
        }

        // Attempt 3: Fallback (Wrap text if it's just a string)
        if (!data) {
            console.warn("AI returned non-JSON text. constructing fallback object.");
            data = {
                optimizedText: rawText,
                originalTokens: prompt.length / 4, // Estimate
                optimizedTokens: rawText.length / 4,
                reductionPercentage: 0,
                explanation: "Model returned raw text. Optimization metrics are estimated."
            };
        }

        const energySaved = (data.reductionPercentage > 25) ? "High (Green)" : "Moderate";

        res.json({ ...data, energySaved, originalText: prompt, usedModel: successfulModel });
    } catch (error: any) {
        console.error("Optimization failed:", error);
        res.status(500).json({ error: error.message || 'Gemini optimization failed' });
    }
}); // End of optimized endpoint


app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
