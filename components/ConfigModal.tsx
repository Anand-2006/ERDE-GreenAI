import React from 'react';
import { calculateImpact } from '../utils/impactCalculator';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: OptimizationConfig;
  setConfig: (config: OptimizationConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, config, setConfig }) => {

  const handleChange = (key: keyof OptimizationConfig, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  const impact = calculateImpact(config, 4000); // 4000 chars ~ 1000 tokens for baseline display

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop with Fade */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}></div>

      {/* Modal with Scale */}
      <div className="relative w-full max-w-[640px] bg-[#0A0A0A] border border-border-dim rounded shadow-2xl overflow-hidden flex flex-col animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-dim">
          <h2 className="text-white text-lg font-semibold tracking-tight uppercase">Configure Model Instance</h2>
        </div>

        <div className="overflow-y-auto max-h-[80vh] custom-scrollbar">
          {/* AI Auto-Pilot Section */}
          <div className="px-6 py-5 border-b border-border-dim bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-verdant-green/20 to-verdant-cyan/20 border border-white/10 flex items-center justify-center group-hover:shadow-verdant-glow transition-all duration-300">
                  <span className="material-symbols-outlined text-white text-[18px]">smart_toy</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white tracking-wide">AI Auto-Pilot</span>
                  <span className="text-[10px] text-gray-500 font-mono">Automatically select optimal model & parameters</span>
                </div>
              </div>
              <button
                onClick={() => handleChange('autoPilot', !config.autoPilot)}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 active:scale-90 ${config.autoPilot ? 'bg-verdant-cyan shadow-cyan-glow' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config.autoPilot ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div className={`px-6 py-6 border-b border-border-dim transition-all duration-300 ${config.autoPilot ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
            <h3 className="text-gray-500 text-[11px] font-bold tracking-[0.1em] uppercase mb-4">Gemini Model Family</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-white text-sm font-medium">Model Version</label>
                  <div className="group relative">
                    <span className="material-symbols-outlined text-[16px] text-gray-500 cursor-help hover:text-verdant-cyan transition-colors">help</span>
                    {/* Enhanced Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-[#1A1A1A] border border-border-dim p-4 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wide border-b border-white/10 pb-1">Architecture Tradeoffs</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <strong className="text-verdant-green text-[11px]">Gemini Flash (Sparse)</strong>
                            <span className="text-[9px] text-gray-500 uppercase">High Efficiency</span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-snug">
                            Uses a "Mixture-of-Experts" (MoE) architecture. Only activates a small subset of parameters per token generated.
                            <br /><span className="text-verdant-green text-[9px] block mt-1 font-mono">~0.5 Wh per 1k tokens</span>
                          </p>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <strong className="text-verdant-pink text-[11px]">Gemini Pro (Dense)</strong>
                            <span className="text-[9px] text-gray-500 uppercase">Deep Reasoning</span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-snug">
                            Activates nearly all parameters for every token. Capable of complex multi-step reasoning but consumes significantly more power.
                            <br /><span className="text-red-400 text-[9px] block mt-1 font-mono">~3.5 Wh per 1k tokens (7x intensity)</span>
                          </p>
                        </div>
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-[#1A1A1A] border-r border-b border-border-dim rotate-45 transform"></div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={config.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    className="w-full bg-[#151515] border border-border-dim rounded px-3 h-12 text-sm text-white focus:ring-1 focus:ring-verdant-green focus:border-verdant-green focus:shadow-verdant-glow/20 outline-none appearance-none cursor-pointer hover:border-white/30 transition-all z-10 relative"
                  >
                    <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Fastest / Lowest Energy)</option>
                    <option value="gemini-2.5-flash-latest">Gemini 2.5 Flash (Legacy Stable)</option>
                    <option value="gemini-3-pro-preview">Gemini 3.0 Pro (High Reasoning / Higher Energy)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-20">expand_more</span>
                </div>

                {/* Visual Tradeoff Meter */}
                <div className="mt-3 bg-white/5 rounded p-3 border border-white/5">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-gray-500 mb-1">
                    <span>Efficiency</span>
                    <span>Reasoning</span>
                  </div>
                  {config.model.includes('flash') ? (
                    <div className="relative h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="absolute left-0 top-0 h-full w-[90%] bg-verdant-green"></div>
                      <div className="absolute right-0 top-0 h-full w-[30%] bg-blue-500 opacity-30"></div>
                    </div>
                  ) : (
                    <div className="relative h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="absolute left-0 top-0 h-full w-[20%] bg-red-500"></div>
                      <div className="absolute right-0 top-0 h-full w-[95%] bg-verdant-pink"></div>
                    </div>
                  )}
                  <div className="flex justify-between mt-2 text-[10px]">
                    <p className="text-gray-400">
                      {config.model.includes('flash') ? (
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px] text-verdant-green">bolt</span> Best for speed & volume</span>
                      ) : (
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px] text-verdant-pink">psychology</span> Best for complex logic</span>
                      )}
                    </p>
                    <span className={`font-mono ${config.model.includes('flash') ? 'text-verdant-green' : 'text-red-400'}`}>
                      {config.model.includes('flash') ? 'Low Carbon' : 'High Carbon'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* API Key Input Section */}
          <div className="px-6 py-6 border-b border-border-dim bg-white/[0.01]">
            <h3 className="text-gray-500 text-[11px] font-bold tracking-[0.1em] uppercase mb-4 flex items-center gap-2">
              Authentication Override
              <span className="w-1.5 h-1.5 rounded-full bg-verdant-green"></span>
            </h3>
            <div className="flex flex-col gap-3">
              <label className="text-white text-sm font-medium flex justify-between">
                <span>Gemini API Key</span>
                <span className="text-[10px] text-gray-500 font-normal">Optional - Overrides System Env</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-verdant-green text-gray-500">
                  <span className="material-symbols-outlined text-[18px]">key</span>
                </div>
                <input
                  type="password"
                  value={config.apiKey || ''}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#151515] border border-border-dim rounded px-3 pl-10 h-12 text-sm text-white placeholder:text-gray-700 focus:ring-1 focus:ring-verdant-green focus:border-verdant-green focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] outline-none transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className={`material-symbols-outlined text-[16px] transition-colors ${config.apiKey ? 'text-verdant-green' : 'text-gray-600'}`}>
                    {config.apiKey ? 'lock' : 'lock_open'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed pl-1 border-l-2 border-white/10">
                Your key is prioritized for all requests. It is never stored on a server and only persists for this session.
              </p>
            </div>
          </div>

          {/* Efficiency & Logic Gates */}
          <div className="px-6 py-6 border-b border-border-dim bg-white/[0.01]">
            <h3 className="text-gray-500 text-[11px] font-bold tracking-[0.1em] uppercase mb-4 flex items-center gap-2">
              Efficiency & Logic Gates
              <span className="w-1.5 h-1.5 rounded-full bg-verdant-cyan"></span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Answer Depth */}
              <div className="flex flex-col gap-2">
                <label className="text-white text-sm font-medium">Answer Depth</label>
                <div className="grid grid-cols-3 gap-1 bg-[#151515] p-1 rounded border border-border-dim">
                  {(['Concise', 'Standard', 'Detailed'] as const).map((depth) => (
                    <button
                      key={depth}
                      onClick={() => handleChange('answerDepth', depth)}
                      className={`py-2 text-[10px] font-bold uppercase transition-all rounded ${config.answerDepth === depth ? 'bg-verdant-cyan text-black shadow-cyan-glow' : 'text-gray-500 hover:text-white'}`}
                    >
                      {depth}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optimization Mode */}
              <div className="flex flex-col gap-2">
                <label className="text-white text-sm font-medium">Optimization Mode</label>
                <div className="grid grid-cols-3 gap-1 bg-[#151515] p-1 rounded border border-border-dim">
                  {(['Concise', 'Structured', 'Deterministic'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleChange('optimizationMode', mode)}
                      className={`py-2 text-[10px] font-bold uppercase transition-all rounded ${config.optimizationMode === mode ? 'bg-verdant-pink text-white shadow-pink-glow' : 'text-gray-500 hover:text-white'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Anticipatory Answer Mode Toggle */}
            <div className="mt-6 flex items-center justify-between p-4 rounded bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors cursor-pointer" onClick={() => handleChange('anticipatoryMode', !config.anticipatoryMode)}>
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-[20px] transition-colors ${config.anticipatoryMode ? 'text-verdant-green' : 'text-gray-500'}`}>lightbulb</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Anticipatory Answer Mode</span>
                  <span className="text-[10px] text-gray-500 font-mono">Predicts and answers likely follow-up questions</span>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${config.anticipatoryMode ? 'bg-verdant-green shadow-verdant-glow' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${config.anticipatoryMode ? 'translate-x-5.5' : 'translate-x-0.5'}`}></div>
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className={`px-6 py-6 border-b border-border-dim transition-all duration-300 ${config.autoPilot ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
            <div className="grid grid-cols-1 gap-8">
              {/* Temperature */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-white text-sm font-medium">Temperature</label>
                  <span className="text-verdant-cyan text-xs font-mono">{config.temperature}</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.1" value={config.temperature}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-verdant-cyan hover:accent-white transition-colors"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-[#0D0D0D] border-t border-border-dim flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-[#555] text-[9px] font-bold uppercase tracking-widest">Est. Impact per 1k tokens</p>
            <div className="flex items-center gap-4">
              <p className="font-mono text-sm text-white flex items-center gap-2">
                <span className="text-white">{impact.wh} Wh</span>
                <span className="text-[#555]">Energy</span>
              </p>
              <div className="w-px h-3 bg-[#333]"></div>
              <p className="font-mono text-sm text-white flex items-center gap-2">
                <span className={`${parseFloat(impact.carbon) < 0.5 ? 'text-verdant-green shadow-verdant-glow' : 'text-yellow-500'}`}>{impact.carbon}g</span>
                <span className="text-[#555]">CO2e</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-verdant-cyan to-[#0077B3] hover:brightness-110 active:scale-[0.98] transition-all duration-200 px-8 py-3 rounded text-white text-xs font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(0,170,255,0.2)] hover:shadow-[0_0_30px_rgba(0,170,255,0.4)]"
          >
            {config.autoPilot ? 'Confirm Auto-Pilot' : 'Apply Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};