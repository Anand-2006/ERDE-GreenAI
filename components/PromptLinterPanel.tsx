import React from 'react';
import { LinterIssue } from '../utils/promptLinter';

interface PromptLinterPanelProps {
  issues: LinterIssue[];
  onDismiss: () => void;
  onContinue: () => void;
}

export const PromptLinterPanel: React.FC<PromptLinterPanelProps> = ({ issues, onDismiss, onContinue }) => {
  if (issues.length === 0) return null;

  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  return (
    <div className="glass-panel rounded-lg p-4 border border-yellow-500/30 bg-yellow-500/5 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-yellow-400 text-[18px]">warning</span>
          <h3 className="text-sm font-bold text-white">Prompt Issues Detected</h3>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-500 hover:text-white transition-colors"
          title="Dismiss"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      
      <div className="space-y-2 mb-4">
        {warnings.map((issue, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <span className="material-symbols-outlined text-yellow-400 text-[14px] mt-0.5">error</span>
            <span className="text-gray-300">{issue.message}</span>
          </div>
        ))}
        {infos.map((issue, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <span className="material-symbols-outlined text-blue-400 text-[14px] mt-0.5">info</span>
            <span className="text-gray-400">{issue.message}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onContinue}
          className="text-xs px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded border border-yellow-500/30 transition-colors"
        >
          Continue Anyway
        </button>
        <span className="text-[10px] text-gray-500">You can proceed, but results may be less optimal.</span>
      </div>
    </div>
  );
};
