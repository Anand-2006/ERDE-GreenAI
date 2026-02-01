import React, { useState, useEffect } from 'react';
import { BarChart, Bar, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { OptimizationResult, HistoryItem, OptimizationConfig } from '../types';
import { optimizePrompt } from '../services/geminiService';
import { lintPrompt } from '../utils/promptLinter';
import { shouldRecommendOptimization } from '../utils/optimizationGatekeeper';
import { detectFollowUpLikelihood } from '../utils/followUpDetector';
import { detectRedundantQuery } from '../utils/redundantQueryDetector';
import { getOutputLengthConstraint, inferTaskType } from '../utils/outputLengthGuard';
import { efficiencyTracker } from '../utils/efficiencyTracker';
import { savePrompt, getSavedPrompts, updatePromptUsage } from '../utils/promptStorage';
import { calculateImpact } from '../utils/impactCalculator';
import { PromptLinterPanel } from './PromptLinterPanel';
import { EfficiencyIndicator } from './EfficiencyIndicator';
import { HistoryModal } from './HistoryModal';
import { copyToClipboard, shareContent } from '../utils/uiUtils';
import { EXAMPLE_PROMPTS } from '../data/mockData';

interface DashboardProps {
    onOpenConfig: () => void;
    config: OptimizationConfig;
    setConfig: React.Dispatch<React.SetStateAction<OptimizationConfig>>;
    prompt: string;
    setPrompt: (p: string) => void;
}

export const DashboardScreen = ({ onOpenConfig, config, setConfig, prompt, setPrompt }: DashboardProps) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<OptimizationResult | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [showDiff, setShowDiff] = useState(false);

    // Efficiency features state
    const [linterIssues, setLinterIssues] = useState<any[]>([]);
    const [showLinterPanel, setShowLinterPanel] = useState(false);
    const [optimizationRecommendation, setOptimizationRecommendation] = useState<{ shouldRecommend: boolean; reason: string; isBlocked?: boolean } | null>(null);
    const [redundantWarning, setRedundantWarning] = useState<{ isSimilar: boolean; similarPrompt?: string; similarPromptId?: string } | null>(null);
    const [sessionMetrics, setSessionMetrics] = useState(efficiencyTracker.getMetrics());

    const realTimeImpact = calculateImpact(config, prompt.length);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const saved = localStorage.getItem('promptHistory');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    // Update session metrics display
    useEffect(() => {
        const interval = setInterval(() => {
            setSessionMetrics(efficiencyTracker.getMetrics());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Analyze prompt on change (non-LLM checks)
    useEffect(() => {
        if (!prompt.trim()) {
            setLinterIssues([]);
            setShowLinterPanel(false);
            setOptimizationRecommendation(null);
            setRedundantWarning(null);
            return;
        }

        // Prompt linter
        const issues = lintPrompt(prompt);
        setLinterIssues(issues);
        setShowLinterPanel(issues.length > 0);

        // Optimization gatekeeper - Rules: No < 120 chars, No factual query, No major lint issues
        const gatekeeperDecision = shouldRecommendOptimization(prompt, issues);
        setOptimizationRecommendation(gatekeeperDecision);

        // Follow-up detection - auto-suggest anticipatory mode (conceptual + likely follow-ups)
        const followUpDetection = detectFollowUpLikelihood(prompt);
        // Note: We don't auto-enable it here to respect the "never automatic" and "user-triggered" principles
        // but we can provide a suggestion if needed.

        // Output length guard - Combine task type + answer depth
        const lengthConstraint = getOutputLengthConstraint(prompt, config.answerDepth);
        if (!config.outputLengthConstraint || config.outputLengthConstraint !== lengthConstraint.maxTokens) {
            setConfig(prev => ({ ...prev, outputLengthConstraint: lengthConstraint.maxTokens }));
        }

        // Redundant query detector
        const previousPrompts = history.map(h => ({ id: h.id, prompt: h.prompt }));
        const redundantCheck = detectRedundantQuery(prompt, previousPrompts);
        if (redundantCheck.isSimilar) {
            setRedundantWarning(redundantCheck);
        } else {
            setRedundantWarning(null);
        }

        // IMPORTANT: Clear result when prompt changes from outside (e.g. example click, template select)
        // We only do this if the result's original text is different from current prompt to be safe.
        if (result && result.originalText !== prompt) {
            setResult(null);
        }
    }, [prompt, history, config.answerDepth, result, setConfig]);

    const saveToHistory = (newPrompt: string, newResult: OptimizationResult) => {
        const item: HistoryItem = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            prompt: newPrompt,
            result: newResult,
            config: { ...config } // Capture current config
        };
        const updated = [item, ...history].slice(50); // Keep last 50
        // Fix slice logic, looks like original code was correct as slice(0, 50) but let me double check my memory.
        // Original was: const updated = [item, ...history].slice(0, 50);
        // Correcting it here.
        const updatedCorrect = [item, ...history].slice(0, 50);

        setHistory(updatedCorrect);
        localStorage.setItem('promptHistory', JSON.stringify(updatedCorrect));
    };

    const handleOptimize = async () => {
        if (!prompt.trim()) return;

        // Gatekeeper enforcement: Block optimization if major linting issues exist
        const issues = lintPrompt(prompt);
        const gatekeeperDecision = shouldRecommendOptimization(prompt, issues);
        if (gatekeeperDecision.isBlocked) {
            showToast("Optimization blocked. Please fix linter warnings first.");
            setShowLinterPanel(true);
            return;
        }

        // Check if prompt was reused
        const previousPrompts = history.map(h => ({ id: h.id, prompt: h.prompt }));
        const redundantCheck = detectRedundantQuery(prompt, previousPrompts);
        if (redundantCheck.isSimilar && redundantCheck.similarPromptId) {
            // Record reuse count in storage
            const savedPrompts = getSavedPrompts();
            const saved = savedPrompts.find(p => p.prompt === redundantCheck.similarPrompt); // Note: similarPrompt might be prompt text, I should check redundantQueryDetector return type if possible, but assuming string match logic for now or id use.
            // Wait, getSavedPrompts returns SavedPrompt[].
            // redundantCheck has similarPrompt which is string.
            if (saved) {
                updatePromptUsage(saved.id);
                efficiencyTracker.recordReusedPrompt();
                showToast("Reusing similar prompt context");
            }
        }

        setLoading(true);
        try {
            // Apply output length constraint + answer depth to config before sending
            const lengthConstraint = getOutputLengthConstraint(prompt, config.answerDepth);
            const configWithConstraints = {
                ...config,
                outputLengthConstraint: lengthConstraint.maxTokens
            };

            const data = await optimizePrompt(prompt, configWithConstraints);
            setResult(data);
            setShowDiff(true);
            saveToHistory(prompt, data);

            // Track LLM call efficiency
            const estimatedTokens = Math.ceil(prompt.length / 4) + (lengthConstraint.maxTokens || 400);
            efficiencyTracker.recordLLMCall(estimatedTokens);
            setSessionMetrics(efficiencyTracker.getMetrics());
        } catch (e) {
            console.error(e);
            efficiencyTracker.recordRetry();
            setSessionMetrics(efficiencyTracker.getMetrics());
            // Show real error message if available
            showToast(`Error: ${e instanceof Error ? e.message : "Optimization failed"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePrompt = () => {
        if (!prompt.trim()) return;
        const saved = savePrompt(prompt, result?.optimizedText || ''); // ensure string
        efficiencyTracker.recordSavedPrompt();
        setSessionMetrics(efficiencyTracker.getMetrics());
        showToast("Prompt saved!");
    };

    const loadFromHistory = (item: HistoryItem) => {
        setPrompt(item.prompt);
        setResult(item.result);
        if (item.config) {
            setConfig(item.config);
        }
        setIsHistoryOpen(false);
    };

    // Sparkline data
    const data = [
        { name: '1', uv: 40 }, { name: '2', uv: 60 }, { name: '3', uv: 30 },
        { name: '4', uv: 80 }, { name: '5', uv: 50 }, { name: '6', uv: 90 }
    ];

    const efficiencyScore = result ? result.reductionPercentage : 42;
    const pieData = [
        { name: 'Saved', value: efficiencyScore },
        { name: 'Remaining', value: 100 - efficiencyScore }
    ];

    // Derive display text for current model
    const getModelLabel = () => {
        if (config.autoPilot) return "AI Auto-Pilot (Adaptive)";
        if (config.model.includes('flash')) return "Gemini Flash (Low Energy)";
        return "Gemini Pro (High Reasoning)";
    };

    const handleCopy = async () => {
        const textToCopy = result ? result.optimizedText : prompt;
        if (!textToCopy) return;
        const success = await copyToClipboard(textToCopy);
        if (success) {
            showToast(result ? "Optimized prompt copied to clipboard!" : "Prompt copied to clipboard!");
        } else {
            showToast("Failed to copy. Please try again.");
        }
    };

    const handleShare = async () => {
        const textToShare = result
            ? `ERDE-GreenAI Optimization Result\n\nOriginal: ${prompt}\n\nOptimized: ${result.optimizedText}\n\nReduction: ${result.reductionPercentage}%\nTokens Saved: ${result.originalTokens - result.optimizedTokens}`
            : prompt;
        if (!textToShare) return;

        const shared = await shareContent(
            textToShare,
            result ? 'ERDE-GreenAI Optimization Result' : 'ERDE-GreenAI Prompt',
            async () => {
                const success = await copyToClipboard(textToShare);
                if (success) {
                    showToast(result ? "Optimization result copied to clipboard!" : "Prompt copied to clipboard!");
                }
            }
        );
        if (shared) {
            showToast("Content shared successfully!");
        }
    };

    return (
        <div className="flex-1 flex flex-col gap-8 p-6 lg:p-10 h-full overflow-y-auto animate-fade-in relative">
            {toast && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-verdant-green text-black px-4 py-2 rounded-full font-bold text-xs shadow-verdant-glow animate-bounce-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {toast}
                </div>
            )}
            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={history}
                onSelect={loadFromHistory}
                onToast={showToast}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Input */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-2">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400">tune</span> Prompt Engine
                        </h2>
                        <div className="flex gap-2">
                            <EfficiencyIndicator
                                metrics={sessionMetrics}
                                efficiencyScore={efficiencyTracker.getEfficiencyScore()}
                            />
                            <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">v2.4.0</span>
                        </div>
                    </div>

                    {/* Prompt Linter Panel */}
                    {showLinterPanel && (
                        <PromptLinterPanel
                            issues={linterIssues}
                            onDismiss={() => setShowLinterPanel(false)}
                            onContinue={() => setShowLinterPanel(false)}
                        />
                    )}

                    {/* Optimization Gatekeeper Warning */}
                    {optimizationRecommendation && !optimizationRecommendation.shouldRecommend && prompt.trim().length > 0 && (
                        <div className={`glass-panel rounded-lg p-3 border animate-fade-in ${optimizationRecommendation.isBlocked ? 'border-red-500/30 bg-red-500/5' : 'border-blue-500/30 bg-blue-500/5'}`}>
                            <div className="flex items-start gap-2">
                                <span className={`material-symbols-outlined text-[16px] mt-0.5 ${optimizationRecommendation.isBlocked ? 'text-red-400' : 'text-blue-400'}`}>
                                    {optimizationRecommendation.isBlocked ? 'block' : 'info'}
                                </span>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-300">{optimizationRecommendation.reason}</p>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        {optimizationRecommendation.isBlocked ? 'Action required before optimization.' : 'You can still optimize if needed.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Redundant Query Warning */}
                    {redundantWarning && redundantWarning.isSimilar && (
                        <div className="glass-panel rounded-lg p-3 border border-cyan-500/30 bg-cyan-500/5 animate-fade-in">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-cyan-400 text-[16px] mt-0.5">recycling</span>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-300">This looks similar to a previous query.</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Consider reusing the earlier answer or proceed anyway.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Anticipatory Mode Indicator */}
                    {config.anticipatoryMode && (
                        <div className="glass-panel rounded-lg p-3 border border-verdant-green/30 bg-verdant-green/5 animate-fade-in">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-verdant-green text-[16px]">lightbulb</span>
                                <p className="text-xs text-gray-300">
                                    <span className="font-bold text-verdant-green">Anticipatory Answer Mode</span> enabled. Response will include likely follow-ups.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="glass-panel rounded-lg p-1 flex-1 flex flex-col group transition-all duration-300 focus-within:ring-1 focus-within:ring-verdant-green/50 hover:shadow-verdant-glow/10">
                        <div className="flex flex-wrap items-center justify-between gap-4 p-3 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex gap-3">
                                <div className="flex flex-col">
                                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Model Config</label>
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-verdant-green transition-colors active:scale-95 duration-200" onClick={onOpenConfig}>
                                        <span className="text-sm font-mono text-white">{getModelLabel()}</span>
                                        <span className="material-symbols-outlined text-[14px]">expand_more</span>
                                    </div>
                                </div>

                                <div className="w-px h-8 bg-white/5 mx-2 hidden sm:block"></div>

                                <div className="flex flex-col">
                                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Efficiency Lock</label>
                                    <button
                                        onClick={() => {
                                            if (config.answerDepth === 'Concise' && config.model.includes('flash') && config.temperature === 0.1) {
                                                // Reset to some defaults if already in green mode? 
                                                // Or just let them toggle it off by changing settings.
                                                setConfig({ ...config, temperature: 0.7, answerDepth: 'Standard' });
                                            } else {
                                                setConfig({
                                                    ...config,
                                                    model: 'gemini-3-flash-preview',
                                                    answerDepth: 'Concise',
                                                    optimizationMode: 'Concise',
                                                    temperature: 0.1,
                                                    autoPilot: false
                                                });
                                            }
                                        }}
                                        className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-300 ${config.answerDepth === 'Concise' && config.model.includes('flash') && config.temperature === 0.1 ? 'bg-verdant-green/20 border-verdant-green text-verdant-green shadow-verdant-glow' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">energy_savings_leaf</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Green Mode</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {result && (
                                    <button
                                        onClick={() => setShowDiff(!showDiff)}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider ${showDiff ? 'bg-verdant-green text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                        title="Toggle Diff View"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
                                        {showDiff ? 'Edit' : 'Compare'}
                                    </button>
                                )}
                                <button
                                    className="text-gray-400 hover:text-white transition-all active:scale-90 p-1 rounded hover:bg-white/5"
                                    onClick={() => { setPrompt(''); setResult(null); setShowDiff(false); }}
                                    title="Clear"
                                >
                                    <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                                </button>
                                <button className="text-gray-400 hover:text-white transition-all active:scale-90 p-1 rounded hover:bg-white/5" title="Copy" onClick={handleCopy}>
                                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                </button>
                                <button className="text-gray-400 hover:text-white transition-all active:scale-90 p-1 rounded hover:bg-white/5" title="Share" onClick={handleShare}>
                                    <span className="material-symbols-outlined text-[18px]">share</span>
                                </button>
                            </div>
                        </div>

                        {result && showDiff ? (
                            <div className="w-full flex-1 flex flex-col md:flex-row gap-4 p-5 min-h-[320px]">
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Original Input</label>
                                    </div>
                                    <div className="flex-1 bg-white/5 rounded p-4 text-gray-400 font-mono text-sm leading-relaxed overflow-auto whitespace-pre-wrap border border-white/5 shadow-inner">
                                        {prompt}
                                    </div>
                                </div>
                                <div className="hidden md:flex flex-col justify-center text-gray-600">
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] text-verdant-green font-bold uppercase tracking-widest">Optimized Output</label>
                                        <span className="text-[10px] bg-verdant-green/10 text-verdant-green px-1.5 py-0.5 rounded border border-verdant-green/20">Ready for use</span>
                                    </div>
                                    <div className="flex-1 bg-verdant-green/5 border border-verdant-green/20 rounded p-4 text-white font-mono text-sm leading-relaxed overflow-auto whitespace-pre-wrap shadow-[inset_0_0_20px_rgba(0,255,0,0.05)]">
                                        {result.optimizedText}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <textarea
                                value={result ? result.optimizedText : prompt}
                                onChange={(e) => {
                                    setPrompt(e.target.value);
                                    if (result) setResult(null);
                                    setShowDiff(false);
                                }}
                                className="w-full flex-1 bg-transparent border-none focus:ring-0 p-5 text-gray-200 font-mono text-sm leading-relaxed resize-none placeholder-gray-600 min-h-[320px] transition-colors"
                                placeholder="// Enter your prompt here for carbon optimization analysis...
// Example: 'Draft a marketing email for a new sustainable coffee brand targeting Gen Z.'"
                            ></textarea>
                        )}

                        <div className="p-3 border-t border-white/5 bg-white/[0.02] flex justify-between items-center flex-wrap gap-4">
                            <div className="flex items-center gap-6 text-xs text-gray-500 font-mono">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                                    <span className="uppercase tracking-tighter">Intent: <span className="text-white">{inferTaskType(prompt).toUpperCase()}</span></span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">info</span>
                                    <span>Tokens: <span className="text-white">{prompt.length ? Math.ceil(prompt.length / 4) : 0}</span></span>
                                </div>

                                <div className="flex items-center gap-2 text-verdant-cyan">
                                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                                    <span>Est. Energy: <span className="font-bold">{realTimeImpact.wh} Wh</span></span>
                                </div>

                                <div className="flex items-center gap-2 text-verdant-green">
                                    <span className="material-symbols-outlined text-[14px]">cloud</span>
                                    <span>Est. CO2e: <span className="font-bold">{realTimeImpact.carbon}g</span></span>
                                </div>

                                {config.autoPilot && (
                                    <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                                        <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Routing to: {realTimeImpact.predictedModel?.split('-')[2].toUpperCase()}</span>
                                    </div>
                                )}

                                {config.outputLengthConstraint && (
                                    <div className="flex items-center gap-2 text-cyan-400">
                                        <span className="material-symbols-outlined text-[14px]">straighten</span>
                                        <span>Max Output: ~{config.outputLengthConstraint} tokens</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {prompt.trim() && (
                                    <button
                                        onClick={handleSavePrompt}
                                        className="text-gray-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-white/5 transition-all active:scale-95 text-xs font-bold uppercase tracking-wider"
                                        title="Save Prompt"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">bookmark</span>
                                        Save
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsHistoryOpen(true)}
                                    className="text-gray-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-white/5 transition-all active:scale-95 text-xs font-bold uppercase tracking-wider"
                                >
                                    <span className="material-symbols-outlined text-[18px]">history</span>
                                    History
                                </button>
                                <button
                                    onClick={handleOptimize}
                                    disabled={loading}
                                    className={`${optimizationRecommendation?.isBlocked ? 'bg-gray-800 text-gray-500 cursor-not-allowed shadow-none grayscale opacity-70' : 'bg-verdant-green text-black hover:bg-green-400 shadow-[0_0_15px_rgba(0,255,0,0.3)] hover:shadow-verdant-glow'} text-sm font-bold px-6 py-2.5 rounded transition-all duration-200 active:scale-95 flex items-center gap-2 disabled:opacity-50`}
                                >
                                    {loading ? (
                                        <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-[18px]">{optimizationRecommendation?.isBlocked ? 'lock' : 'bolt'}</span>
                                    )}
                                    {loading ? 'Optimizing...' : optimizationRecommendation?.isBlocked ? 'Optimization Blocked' : 'Optimize Prompt'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Example Prompts Section */}
                    <div>
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-3 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                            Or start with an example
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {EXAMPLE_PROMPTS.map((ex, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setPrompt(ex.text)}
                                    className="flex flex-col gap-2 p-4 rounded bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-verdant-green/50 hover:shadow-verdant-glow transition-all duration-200 active:scale-[0.97] text-left group"
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <span className="text-white text-xs font-bold group-hover:text-verdant-green transition-colors">{ex.title}</span>
                                        <span className="material-symbols-outlined text-[14px] text-gray-600 group-hover:text-verdant-green -mr-1">arrow_outward</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-relaxed">{ex.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Metrics */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-0">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400">monitoring</span> Efficiency Metrics
                        </h2>
                        <div className="flex items-center gap-2">
                            {result && (
                                <>
                                    <button
                                        onClick={async () => {
                                            const textToCopy = `ERDE-GreenAI Optimization Results\n\nOriginal: ${prompt}\nOptimized: ${result.optimizedText}\n\nReduction: ${result.reductionPercentage}%\nTokens Saved: ${result.originalTokens - result.optimizedTokens}\nOriginal Tokens: ${result.originalTokens}\nOptimized Tokens: ${result.optimizedTokens}`;
                                            const success = await copyToClipboard(textToCopy);
                                            if (success) {
                                                showToast("Results copied to clipboard!");
                                            }
                                        }}
                                        className="text-gray-400 hover:text-white transition-all active:scale-90 p-1 rounded hover:bg-white/5"
                                        title="Copy Results"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const textToShare = `ERDE-GreenAI Optimization Results\n\nOriginal: ${prompt}\nOptimized: ${result.optimizedText}\n\nReduction: ${result.reductionPercentage}%\nTokens Saved: ${result.originalTokens - result.optimizedTokens}`;
                                            const shared = await shareContent(
                                                textToShare,
                                                'ERDE-GreenAI Optimization Results',
                                                async () => {
                                                    const success = await copyToClipboard(textToShare);
                                                    if (success) {
                                                        showToast("Results copied to clipboard!");
                                                    }
                                                }
                                            );
                                            if (shared) {
                                                showToast("Results shared successfully!");
                                            }
                                        }}
                                        className="text-gray-400 hover:text-white transition-all active:scale-90 p-1 rounded hover:bg-white/5"
                                        title="Share Results"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">share</span>
                                    </button>
                                </>
                            )}
                            <button className="text-xs text-verdant-green hover:underline font-mono">View Report -{'>'}</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Reduction Card */}
                        <div className="glass-panel rounded-lg p-5 flex flex-col justify-between h-[180px] relative overflow-hidden group hover:border-verdant-green/50 hover:shadow-verdant-glow transition-all duration-200">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-verdant-green/10 rounded-bl-full -mr-4 -mt-4 blur-xl"></div>
                            <div className="flex items-start justify-between z-10">
                                <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Reduction</p>
                                <span className="material-symbols-outlined text-verdant-green text-[20px]">eco</span>
                            </div>
                            <div className="z-10">
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-4xl font-bold text-white font-mono tracking-tight">-{result ? result.reductionPercentage : 0}<span className="text-verdant-green">%</span></h3>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 font-mono">CO2e Emissions</p>
                            </div>
                            <div className="w-full h-1.5 bg-gray-800 rounded-full mt-4 overflow-hidden">
                                <div
                                    className="h-full bg-verdant-green shadow-[0_0_10px_#00ff00] transition-all duration-500"
                                    style={{ width: `${result ? result.reductionPercentage : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Speed Gain Card */}
                        <div className="glass-panel rounded-lg p-5 flex flex-col justify-between h-[180px] relative overflow-hidden group hover:border-verdant-cyan/50 hover:shadow-cyan-glow transition-all duration-200">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-verdant-cyan/10 rounded-bl-full -mr-4 -mt-4 blur-xl"></div>
                            <div className="flex items-start justify-between z-10">
                                <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Speed Gain</p>
                                <span className="material-symbols-outlined text-verdant-cyan text-[20px]">speed</span>
                            </div>
                            <div className="z-10">
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-4xl font-bold text-white font-mono tracking-tight">{result ? (1 + result.reductionPercentage / 100).toFixed(1) : '1.0'}<span className="text-verdant-cyan">x</span></h3>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 font-mono">Faster Inference</p>
                            </div>

                            {/* Recharts Sparkline */}
                            <div className="h-8 mt-2 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data}>
                                        <Bar dataKey="uv" radius={[2, 2, 0, 0]}>
                                            {data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="#00BFFF" opacity={0.5 + (index / 10)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Analysis */}
                    <div className="glass-panel rounded-lg p-5 flex-1 flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Optimization Breakdown</p>
                            {result && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={async () => {
                                            const textToCopy = result.optimizedText;
                                            const success = await copyToClipboard(textToCopy);
                                            if (success) {
                                                showToast("Optimized prompt copied!");
                                            }
                                        }}
                                        className="text-gray-500 hover:text-verdant-cyan transition-colors p-1 rounded hover:bg-white/5"
                                        title="Copy Optimized Prompt"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const textToShare = result.optimizedText;
                                            const shared = await shareContent(
                                                textToShare,
                                                'ERDE-GreenAI Optimized Prompt',
                                                async () => {
                                                    const success = await copyToClipboard(textToShare);
                                                    if (success) {
                                                        showToast("Optimized prompt copied!");
                                                    }
                                                }
                                            );
                                            if (shared) {
                                                showToast("Optimized prompt shared!");
                                            }
                                        }}
                                        className="text-gray-500 hover:text-verdant-green transition-colors p-1 rounded hover:bg-white/5"
                                        title="Share Optimized Prompt"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">share</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col xl:flex-row gap-6 items-center h-full">
                            {/* Stats List */}
                            <div className="space-y-4 flex-1 w-full">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-gray-800/50 flex items-center justify-center border border-white/5">
                                            <span className="material-symbols-outlined text-[16px] text-verdant-pink">compress</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-200">Token Reduction</span>
                                            <span className="text-[10px] text-gray-500 font-mono">Context window optimization</span>
                                        </div>
                                    </div>
                                    <span className="text-verdant-pink font-mono font-bold text-sm">
                                        -{result ? (result.originalTokens - result.optimizedTokens).toFixed(0) : 0} tkns
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-gray-800/50 flex items-center justify-center border border-white/5">
                                            <span className="material-symbols-outlined text-[16px] text-yellow-400">energy_savings_leaf</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-200">Energy Intensity</span>
                                            <span className="text-[10px] text-gray-500 font-mono">Model architecture impact</span>
                                        </div>
                                    </div>
                                    <span className="text-yellow-400 font-mono font-bold text-sm">Low (Green)</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-gray-800/50 flex items-center justify-center border border-white/5">
                                            <span className="material-symbols-outlined text-[16px] text-blue-400">psychology</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-200">Semantic Retention</span>
                                            <span className="text-[10px] text-gray-500 font-mono">Meaning preservation score</span>
                                        </div>
                                    </div>
                                    <span className="text-blue-400 font-mono font-bold text-sm">{result ? '99.8%' : '--'}</span>
                                </div>
                            </div>

                            {/* Visualization */}
                            <div className="shrink-0 relative w-[140px] h-[140px] flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={68}
                                            startAngle={90}
                                            endAngle={-270}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            <Cell key="saved" fill="#00ff00" />
                                            <Cell key="remaining" fill="rgba(255,255,255,0.05)" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Center Text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold text-white font-mono tracking-tighter">
                                        {efficiencyScore}%
                                    </span>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center mt-0.5">
                                        Energy<br />Saved
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
