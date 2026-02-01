import React from 'react';
import { SessionMetrics } from '../utils/efficiencyTracker';

interface EfficiencyIndicatorProps {
  metrics: SessionMetrics;
  efficiencyScore: number;
}

export const EfficiencyIndicator: React.FC<EfficiencyIndicatorProps> = ({ metrics, efficiencyScore }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-verdant-green';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-verdant-green/10 border-verdant-green/30';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  return (
    <div className={`glass-panel rounded-lg p-3 border ${getScoreBg(efficiencyScore)}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Efficiency</span>
        <span className={`text-sm font-bold font-mono ${getScoreColor(efficiencyScore)}`}>
          {efficiencyScore}/100
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-400">
        <div>
          <span className="text-gray-500">Calls:</span> <span className="text-white font-mono">{metrics.llmCalls}</span>
        </div>
        <div>
          <span className="text-gray-500">Retries:</span> <span className={`font-mono ${metrics.retries > 0 ? 'text-red-400' : 'text-white'}`}>{metrics.retries}</span>
        </div>
        <div>
          <span className="text-gray-500">Tokens:</span> <span className="text-white font-mono">~{Math.round(metrics.estimatedTokens / 1000)}k</span>
        </div>
      </div>
      
      {metrics.reusedPrompts > 0 && (
        <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-verdant-green">
          <span className="material-symbols-outlined text-[12px] align-middle">recycling</span>
          {' '}Reused {metrics.reusedPrompts} prompt{metrics.reusedPrompts !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
