import { OptimizationConfig } from '../types';

export interface ImpactMetrics {
    wh: string;
    carbon: string;
    predictedModel?: string;
}

export const calculateImpact = (config: OptimizationConfig, promptLength: number): ImpactMetrics => {
    // Base energy per 1k tokens (Wh)
    let baseWh = 0;
    let predictedModel = config.model;

    if (config.autoPilot) {
        predictedModel = promptLength > 500 ? "gemini-3-pro-preview" : "gemini-3-flash-preview";
        baseWh = promptLength > 500 ? 3.5 : 0.6;
    } else {
        switch (config.model) {
            case 'gemini-3-flash-preview': baseWh = 0.6; break;
            case 'gemini-2.5-flash-latest': baseWh = 0.5; break;
            case 'gemini-3-pro-preview': baseWh = 3.5; break;
            default: baseWh = 2.0;
        }
    }

    // Temperature penalty (higher entropy = slightly more compute cycles theoretical)
    const tempPenalty = 1 + (config.temperature * 0.1);

    // Account for answer depth in token estimation
    const depthMultiplier = config.answerDepth === 'Concise' ? 0.5 : config.answerDepth === 'Detailed' ? 2 : 1;
    const estimatedTokens = (promptLength / 4) * depthMultiplier;

    // Impact per query based on estimated tokens
    const estimatedWh = (baseWh * (estimatedTokens / 1000)) * tempPenalty;

    // Carbon Impact (Simplified global average intensity ~475g/kWh, but using low-carbon assume ~200g/kWh for optimization baseline)
    const avgIntensity = 200;
    const carbonGrams = (estimatedWh / 1000) * avgIntensity;

    return {
        wh: estimatedWh.toFixed(4),
        carbon: carbonGrams.toFixed(5),
        predictedModel
    };
};
