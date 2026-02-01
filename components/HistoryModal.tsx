import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { copyToClipboard, shareContent } from '../utils/uiUtils';

export const HistoryModal = ({
    isOpen,
    onClose,
    history,
    onSelect,
    onToast
}: {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onSelect: (item: HistoryItem) => void;
    onToast?: (msg: string) => void;
}) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = async (e: React.MouseEvent, item: HistoryItem) => {
        e.stopPropagation();
        const textToCopy = `Prompt: ${item.prompt}\n\nOptimized: ${item.result.optimizedText}\n\nReduction: ${item.result.reductionPercentage}%\nTokens Saved: ${item.result.originalTokens - item.result.optimizedTokens}`;
        const success = await copyToClipboard(textToCopy);
        if (success) {
            setCopiedId(item.id);
            if (onToast) onToast('History item copied to clipboard!');
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    const handleShare = async (e: React.MouseEvent, item: HistoryItem) => {
        e.stopPropagation();
        const textToShare = `ERDE-GreenAI Optimization Result\n\nPrompt: ${item.prompt}\n\nOptimized: ${item.result.optimizedText}\n\nReduction: ${item.result.reductionPercentage}%\nTokens Saved: ${item.result.originalTokens - item.result.optimizedTokens}`;
        const shared = await shareContent(textToShare, 'ERDE-GreenAI Optimization', async () => {
            const success = await copyToClipboard(textToShare);
            if (success && onToast) {
                onToast('Optimization result copied to clipboard!');
            }
        });
        if (shared && onToast) {
            onToast('Optimization result shared!');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
            <div className="relative w-full max-w-[500px] bg-[#0A0A0A] border border-border-dim rounded-lg shadow-2xl flex flex-col max-h-[70vh] animate-scale-in">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-dim">
                    <h2 className="text-white text-md font-semibold tracking-tight uppercase flex items-center gap-2">
                        <span className="material-symbols-outlined text-verdant-cyan text-[20px]">history</span>
                        Optimization History
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-transform active:scale-90 p-1">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="overflow-y-auto p-2 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 font-mono text-xs">No history found. Start optimizing!</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-2 p-3 rounded border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-verdant-cyan/30 hover:shadow-cyan-glow transition-all duration-200 group"
                                >
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-verdant-green font-bold bg-verdant-green/10 px-1.5 py-0.5 rounded border border-verdant-green/20">
                                                -{item.result.reductionPercentage}%
                                            </span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleCopy(e, item)}
                                                    className="text-gray-500 hover:text-verdant-cyan transition-colors p-1 rounded hover:bg-white/5"
                                                    title="Copy"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        {copiedId === item.id ? 'check' : 'content_copy'}
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={(e) => handleShare(e, item)}
                                                    className="text-gray-500 hover:text-verdant-green transition-colors p-1 rounded hover:bg-white/5"
                                                    title="Share"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">share</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onSelect(item)}
                                        className="text-sm text-gray-300 line-clamp-2 font-mono text-left hover:text-white transition-colors active:scale-[0.98]"
                                    >
                                        {item.prompt}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
