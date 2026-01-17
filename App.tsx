import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ConfigModal } from './components/ConfigModal';
import { AppView, PromptTemplate, OptimizationResult, HistoryItem, OptimizationConfig } from './types';
import { optimizePrompt } from './services/geminiService';
import { BarChart, Bar, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// --- MOCK DATA ---
const templates: PromptTemplate[] = [
  { id: '1', title: 'Long-Form Research Synth', description: 'Aggregates multiple PDF sources into a coherent technical synthesis with citation mapping.', category: 'Research', rating: 'A+', tokens: 2450, savings: 54, models: ['gpt4', 'claude'] },
  { id: '2', title: 'Semantic CSV Extractor', description: 'Converts unstructured call transcripts into clean CSV data with 98% semantic accuracy.', category: 'Extraction', rating: 'A+', tokens: 1120, savings: 62, models: ['gpt4'] },
  { id: '3', title: 'Zero-Shot Sentiment Core', description: 'A highly compressed prompt for bulk sentiment analysis with minimal system-role overhead.', category: 'Analysis', rating: 'A', tokens: 85, savings: 41, models: ['claude'] },
  { id: '4', title: 'Postgres Query Optimizer', description: 'Generates highly optimized SQL queries with specific constraints on join complexity.', category: 'Development', rating: 'A+', tokens: 340, savings: 71, models: ['gpt4'] },
  { id: '5', title: 'Minimalist Product Description', description: 'Creates punchy, high-converting descriptions without conversational fluff.', category: 'Drafting', rating: 'A+', tokens: 150, savings: 48, models: ['claude'] },
  { id: '6', title: 'JSON Extractor Strict', description: 'Forces only valid JSON output without markdown fencing or filler tokens.', category: 'Logic', rating: 'A+', tokens: 90, savings: 74, models: ['gpt4'] }
];

const EXAMPLE_PROMPTS = [
  { 
    title: 'SQL Query Cleanup', 
    desc: 'Simplify complex joins for better readability.', 
    text: 'Optimize this SQL query which joins 5 tables (users, orders, items, inventory, shipping) to find the top 10 spending customers in California who ordered in the last 30 days. Remove redundant subqueries.' 
  },
  { 
    title: 'Customer Apology', 
    desc: 'Professional tone for service outages.', 
    text: 'Draft a polite and professional email to customers explaining a 2-hour service outage due to a database migration. Emphasize that no data was lost and offer a 5% discount on the next bill.' 
  },
  { 
    title: 'Python Data Parser', 
    desc: 'Efficient CSV extraction logic.', 
    text: 'Write a Python script using pandas to read a large CSV file (5GB), filter for rows where the "status" column is "active", and export the "email" and "name" columns to a new JSON file.' 
  }
];

const SAVINGS_DATA = [
  { month: 'Jan', savings: 2.4 },
  { month: 'Feb', savings: 3.8 },
  { month: 'Mar', savings: 5.1 },
  { month: 'Apr', savings: 8.4 },
  { month: 'May', savings: 11.2 },
  { month: 'Jun', savings: 14.2 },
];

// --- AUTH SERVICE (SIMULATED BACKEND) ---
const AUTH_DB_KEY = 'verdant_users_db';

const authService = {
  register: (email, password) => {
    const db = JSON.parse(localStorage.getItem(AUTH_DB_KEY) || '[]');
    if (db.find((u: any) => u.email === email)) {
      throw new Error('User already registered.');
    }
    const newUser = { email, password, createdAt: Date.now() };
    db.push(newUser);
    localStorage.setItem(AUTH_DB_KEY, JSON.stringify(db));
    return newUser;
  },
  login: (email, password) => {
    const db = JSON.parse(localStorage.getItem(AUTH_DB_KEY) || '[]');
    const user = db.find((u: any) => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid credentials.');
    }
    return user;
  }
};

// --- COMPONENTS ---

const HistoryModal = ({ 
  isOpen, 
  onClose, 
  history, 
  onSelect 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  history: HistoryItem[]; 
  onSelect: (item: HistoryItem) => void; 
}) => {
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
                <button 
                  key={item.id} 
                  onClick={() => onSelect(item)}
                  className="flex flex-col gap-2 p-3 rounded border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-verdant-cyan/30 hover:shadow-cyan-glow transition-all duration-200 active:scale-[0.98] text-left group"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-verdant-green font-bold bg-verdant-green/10 px-1.5 py-0.5 rounded border border-verdant-green/20">
                      -{item.result.reductionPercentage}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2 font-mono">{item.prompt}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 1. LOGIN SCREEN
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      try {
        if (isSignUp) {
          authService.register(email, password);
        } else {
          authService.login(email, password);
        }
        onLogin();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Left Panel */}
      <section className="relative flex flex-1 flex-col justify-between bg-[#050505] p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-border-dim z-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white text-[24px]">token</span>
          <span className="font-mono text-sm tracking-widest text-white font-bold uppercase">Verdant-Route</span>
        </div>
        
        <div className="flex flex-col gap-6 max-w-xl my-10 lg:my-0 animate-fade-in">
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Code is Carbon<span className="text-verdant-green">.</span>
          </h1>
          <p className="font-body text-gray-500 text-lg font-light leading-relaxed max-w-md">
            Optimizing AI pipelines for a greener grid. Every cycle counts when you are building at planetary scale.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 font-mono text-xs tracking-wider text-gray-500">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white text-[18px]">forest</span>
            <div>
              <span className="block text-white font-bold">GLOBAL SAVINGS: 14.2 TONS</span>
              <span className="text-[10px] opacity-60">CUMULATIVE SINCE 2023</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel */}
      <section className="relative flex flex-1 flex-col items-center justify-center bg-[#0A0A0A] p-4 lg:p-16 border-l border-border-dim">
        <div className="w-full max-w-[320px] flex flex-col gap-10 animate-slide-up">
          <div className="text-center lg:text-left mb-2">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Access Gate // 01</h2>
            <div className="h-px w-8 bg-verdant-green"></div>
          </div>
          
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2 group">
              <label className="font-mono text-[11px] font-medium tracking-wider text-gray-500 group-focus-within:text-white transition-colors">WORK EMAIL</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@infrastructure.ai" 
                className="bg-transparent border border-[#333] text-white text-sm font-mono placeholder:text-[#333] rounded h-12 px-4 focus:ring-0 focus:border-white transition-colors duration-200 hover:border-white/30 focus:shadow-verdant-glow" 
              />
            </div>
            <div className="flex flex-col gap-2 group">
              <label className="font-mono text-[11px] font-medium tracking-wider text-gray-500 group-focus-within:text-white transition-colors">PASSWORD</label>
              <div className="relative">
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••" 
                  className="w-full bg-transparent border border-[#333] text-white text-sm font-mono placeholder:text-[#333] rounded h-12 px-4 pr-10 focus:ring-0 focus:border-white transition-colors duration-200 hover:border-white/30 focus:shadow-verdant-glow" 
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#333] text-lg pointer-events-none">lock</span>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-xs font-mono bg-red-500/10 p-2 rounded border border-red-500/20 flex items-center gap-2 animate-pulse">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 flex items-center justify-center h-12 w-full bg-white hover:bg-[#e5e5e5] text-black font-bold text-sm tracking-wide rounded transition-all duration-200 active:scale-95 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
              ) : (
                isSignUp ? 'ESTABLISH LINK' : 'INITIALIZE WORKSPACE'
              )}
            </button>
            
            <button 
              type="button" 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="mt-2 text-center font-mono text-xs text-gray-500 hover:text-white underline decoration-1 underline-offset-4 transition-colors"
            >
              {isSignUp ? 'Already have credentials? Log in' : 'Create new access node'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#1F1F1F] flex items-center justify-between text-[10px] text-[#444] font-mono">
            <span>V.2.4.0-STABLE</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#333]"></span> SYSTEM NORMAL</span>
          </div>
        </div>
      </section>
    </div>
  );
};

// 2. DASHBOARD SCREEN
interface DashboardProps {
  onOpenConfig: () => void;
  config: OptimizationConfig;
  setConfig: (c: OptimizationConfig) => void;
}

const DashboardScreen = ({ onOpenConfig, config, setConfig }: DashboardProps) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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

  const saveToHistory = (newPrompt: string, newResult: OptimizationResult) => {
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      prompt: newPrompt,
      result: newResult,
      config: { ...config } // Capture current config
    };
    const updated = [item, ...history].slice(0, 50); // Keep last 50
    setHistory(updated);
    localStorage.setItem('promptHistory', JSON.stringify(updated));
  };

  const handleOptimize = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const data = await optimizePrompt(prompt, config);
      setResult(data);
      saveToHistory(prompt, data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="flex-1 flex flex-col gap-8 p-6 lg:p-10 h-full overflow-y-auto animate-fade-in">
      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history}
        onSelect={loadFromHistory}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400">tune</span> Prompt Engine
            </h2>
            <div className="flex gap-2">
              <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">v2.4.0</span>
            </div>
          </div>

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
              </div>
              <div className="flex gap-2">
                <button 
                  className="text-gray-400 hover:text-white transition-all active:scale-90 p-1 rounded hover:bg-white/5" 
                  onClick={() => { setPrompt(''); setResult(null); }}
                  title="Clear"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                </button>
                <button className="text-gray-400 hover:text-white transition-all active:scale-90 p-1 rounded hover:bg-white/5" title="Copy">
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>
            </div>
            
            <textarea 
              value={result ? result.optimizedText : prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full flex-1 bg-transparent border-none focus:ring-0 p-5 text-gray-200 font-mono text-sm leading-relaxed resize-none placeholder-gray-600 min-h-[320px] transition-colors"
              placeholder="// Enter your prompt here for carbon optimization analysis...
// Example: 'Draft a marketing email for a new sustainable coffee brand targeting Gen Z.'"
            ></textarea>

            <div className="p-3 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                <span className="material-symbols-outlined text-[14px]">info</span>
                <span>Est. Tokens: {prompt.length ? Math.ceil(prompt.length / 4) : 0}</span>
              </div>
              <div className="flex items-center gap-3">
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
                  className="bg-verdant-green text-black text-sm font-bold px-6 py-2.5 rounded hover:bg-green-400 transition-all duration-200 shadow-[0_0_15px_rgba(0,255,0,0.3)] hover:shadow-verdant-glow active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                  )}
                  {loading ? 'Optimizing...' : 'Optimize Prompt'}
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
            <button className="text-xs text-verdant-green hover:underline font-mono">View Report -{'>'}</button>
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
                  <h3 className="text-4xl font-bold text-white font-mono tracking-tight">-{result ? result.reductionPercentage : 42}<span className="text-verdant-green">%</span></h3>
                </div>
                <p className="text-xs text-gray-400 mt-1 font-mono">CO2e Emissions</p>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full mt-4 overflow-hidden">
                <div className="h-full w-[42%] bg-verdant-green shadow-[0_0_10px_#00ff00]"></div>
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
                  <h3 className="text-4xl font-bold text-white font-mono tracking-tight">1.2<span className="text-verdant-cyan">x</span></h3>
                </div>
                <p className="text-xs text-gray-400 mt-1 font-mono">Faster Inference</p>
              </div>
              
              {/* Recharts Sparkline */}
              <div className="h-8 mt-2 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <Bar dataKey="uv" radius={[2, 2, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#00BFFF" opacity={0.5 + (index/10)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Analysis */}
          <div className="glass-panel rounded-lg p-5 flex-1 flex flex-col gap-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider font-bold border-b border-white/5 pb-2">Optimization Breakdown</p>
            
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
                    -{result ? (result.originalTokens - result.optimizedTokens).toFixed(0) : 145} tkns
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
                  <span className="text-blue-400 font-mono font-bold text-sm">99.8%</span>
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
                    Energy<br/>Saved
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

// 3. GALLERY SCREEN
const GalleryScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShare = (e: React.MouseEvent, template: PromptTemplate) => {
    e.stopPropagation();
    const textToShare = `${template.title}\n\n${template.description}\n\nCategory: ${template.category}\nRating: ${template.rating}`;
    navigator.clipboard.writeText(textToShare);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full animate-fade-in">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-highlight p-6 flex flex-col gap-8 hidden lg:flex overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">AI Models</h3>
          <div className="flex flex-col gap-2">
            {['Gemini 3.0 Pro', 'Gemini 3.0 Flash', 'Gemini 2.5 Flash'].map((m) => (
              <label key={m} className="flex items-center gap-3 group cursor-pointer active:scale-[0.98] transition-transform">
                <div className="w-4 h-4 border border-white/20 rounded-sm flex items-center justify-center group-hover:border-verdant-green transition-colors">
                  {m === 'Gemini 3.0 Pro' && <div className="w-2 h-2 bg-verdant-green rounded-sm"></div>}
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white">{m}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Purpose</h3>
          <div className="flex flex-col gap-2">
            <button className="flex items-center justify-between px-3 py-2 rounded bg-white/5 border border-white/10 text-sm text-white text-left shadow-sm">
              <span>All Templates</span>
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono">{templates.length}</span>
            </button>
            {['Code Generation', 'Data Extraction', 'Analysis', 'Creative Writing'].map(c => (
              <button key={c} className="flex items-center justify-between px-3 py-2 rounded text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all active:scale-[0.98] text-left">
                <span>{c}</span>
                <span className="text-[10px] text-gray-600 font-mono">{Math.floor(Math.random() * 50)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Carbon Rating</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded border border-verdant-green/20 bg-verdant-green/5 text-verdant-green text-[10px] font-bold cursor-pointer hover:bg-verdant-green/10 transition-colors">A+ (Low)</span>
            <span className="px-2 py-1 rounded border border-white/10 bg-white/5 text-gray-400 text-[10px] font-bold cursor-pointer hover:bg-white/10 transition-colors">A (Medium)</span>
          </div>
        </div>
      </aside>

      {/* Main Grid */}
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Prompt Template Gallery</h2>
            <p className="text-sm text-gray-500 mt-1">Select from carbon-optimized community templates.</p>
          </div>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[18px] group-focus-within:text-verdant-green transition-colors">search</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..." 
              className="bg-white/5 border border-white/10 rounded pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-verdant-green/50 focus:border-verdant-green/50 focus:shadow-verdant-glow/20 outline-none w-64 transition-all duration-200" 
            />
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-50">
             <span className="material-symbols-outlined text-4xl mb-4">search_off</span>
             <p className="text-sm font-mono">No templates found matching "{searchQuery}"</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map((t) => (
              <div key={t.id} className="glass-panel p-6 rounded group hover:bg-white/[0.06] transition-all duration-200 active:scale-[0.98] cursor-pointer border border-transparent hover:border-verdant-green/50 hover:shadow-verdant-glow relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <span className={`text-[10px] border px-2 py-1 rounded font-mono uppercase tracking-wider 
                      ${t.category === 'Research' ? 'bg-blue-900/30 text-blue-300 border-blue-500/20' : 
                        t.category === 'Extraction' ? 'bg-cyan-900/30 text-cyan-300 border-cyan-500/20' :
                        t.category === 'Analysis' ? 'bg-pink-900/30 text-pink-300 border-pink-500/20' : 
                        'bg-purple-900/30 text-purple-300 border-purple-500/20'}`}>
                      {t.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-green-900/20 px-2 py-1 rounded border border-green-500/20">
                    {t.rating === 'A+' && <span className="w-1.5 h-1.5 rounded-full bg-verdant-green animate-pulse"></span>}
                    <span className={`text-[10px] font-bold ${t.rating === 'A+' ? 'text-verdant-green' : 'text-yellow-400'}`}>{t.rating}</span>
                  </div>
                </div>
                <h4 className={`text-lg font-semibold text-white mb-2 transition-colors ${
                  t.category === 'Research' ? 'group-hover:text-blue-300' :
                  t.category === 'Extraction' ? 'group-hover:text-cyan-300' :
                  'group-hover:text-verdant-green'
                }`}>{t.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-2 mb-6">{t.description}</p>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">Avg. Tokens</span>
                    <span className="text-xs font-mono text-gray-300">~{t.tokens} tkns</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">CO2e Saving</span>
                    <span className="text-xs font-mono text-verdant-green">-{t.savings}% vs Standard</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {t.models.map((m, i) => (
                      <div key={i} className="w-6 h-6 rounded border border-[#050505] bg-gray-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px] text-gray-400">
                          {m === 'gpt4' ? 'psychology' : 'neurology'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => handleShare(e, t)}
                      className="text-gray-500 hover:text-verdant-cyan transition-colors p-1 rounded hover:bg-white/5"
                      title="Copy Details"
                    >
                       <span className="material-symbols-outlined text-[18px]">
                         {copiedId === t.id ? 'check' : 'share'}
                       </span>
                    </button>
                    <span className="material-symbols-outlined text-gray-600 group-hover:text-white transition-colors">arrow_forward</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 4. ABOUT SCREEN (MISSION)
const AboutScreen = ({ onNavigate }: { onNavigate: (view: AppView) => void }) => {
  // State for animations
  const [activePipelineStep, setActivePipelineStep] = useState(0);

  useEffect(() => {
    const pipelineInterval = setInterval(() => {
      setActivePipelineStep((prev) => (prev + 1) % 5);
    }, 1200);
    return () => clearInterval(pipelineInterval);
  }, []);

  return (
    <div className="flex-1 p-6 lg:p-12 overflow-y-auto pb-32">
      <div className="max-w-4xl mx-auto space-y-32 animate-slide-up duration-1000">
        
        {/* SECTION 1: HERO - The Invisible Cost */}
        <section className="text-center py-20 relative">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-verdant-green/5 rounded-full blur-[100px] pointer-events-none"></div>
           <div className="relative z-10">
             <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-6 leading-[0.9]">
               The <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">Invisible</span><br/> 
               Engine
             </h1>
             <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
               We see the magic of intelligence. We miss the machinery of extraction.
               Every prompt you type spins a turbine somewhere in the world.
             </p>
           </div>
        </section>

        {/* SECTION 2: ANATOMY OF A QUERY */}
        <section className="space-y-12">
           <div className="text-center space-y-4">
              <h2 className="text-sm font-mono text-verdant-cyan uppercase tracking-[0.3em]">System Mechanics</h2>
              <h3 className="text-3xl font-bold text-white">Anatomy of a Single Query</h3>
              <p className="text-gray-500 text-sm max-w-lg mx-auto">Trace the physical path of a digital request. It travels further than you think.</p>
           </div>

           <div className="glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                 {/* Step 1: User */}
                 <div className={`flex flex-col items-center gap-4 transition-opacity duration-500 ${activePipelineStep === 0 ? 'opacity-100 scale-105' : 'opacity-40'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${activePipelineStep === 0 ? 'bg-white text-black border-white shadow-[0_0_30px_white]' : 'bg-transparent text-white border-white/20'}`}>
                       <span className="material-symbols-outlined text-2xl">person</span>
                    </div>
                    <span className="text-xs font-mono uppercase tracking-widest">Input</span>
                 </div>

                 {/* Connector */}
                 <div className="h-px w-full md:w-24 bg-gray-800 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white to-transparent animate-flow-beam ${activePipelineStep === 0 ? 'opacity-100' : 'opacity-0'}`}></div>
                 </div>

                 {/* Step 2: API Gateway */}
                 <div className={`flex flex-col items-center gap-4 transition-opacity duration-500 ${activePipelineStep === 1 ? 'opacity-100 scale-105' : 'opacity-40'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${activePipelineStep === 1 ? 'bg-verdant-cyan text-black border-verdant-cyan shadow-cyan-glow' : 'bg-transparent text-white border-white/20'}`}>
                       <span className="material-symbols-outlined text-2xl">api</span>
                    </div>
                    <span className="text-xs font-mono uppercase tracking-widest">Gateway</span>
                 </div>

                 {/* Connector */}
                  <div className="h-px w-full md:w-24 bg-gray-800 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-verdant-cyan to-transparent animate-flow-beam ${activePipelineStep === 1 ? 'opacity-100' : 'opacity-0'}`}></div>
                 </div>

                 {/* Step 3: Compute Cluster */}
                 <div className={`flex flex-col items-center gap-4 transition-opacity duration-500 ${activePipelineStep === 2 ? 'opacity-100 scale-105' : 'opacity-40'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${activePipelineStep === 2 ? 'bg-verdant-pink text-white border-verdant-pink shadow-[0_0_30px_#ff007f]' : 'bg-transparent text-white border-white/20'}`}>
                       <span className="material-symbols-outlined text-2xl">memory</span>
                    </div>
                    <span className="text-xs font-mono uppercase tracking-widest">Compute</span>
                 </div>

                  {/* Connector */}
                  <div className="h-px w-full md:w-24 bg-gray-800 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-verdant-pink to-transparent animate-flow-beam ${activePipelineStep === 2 ? 'opacity-100' : 'opacity-0'}`}></div>
                 </div>

                 {/* Step 4: Heat/Output */}
                 <div className={`flex flex-col items-center gap-4 transition-opacity duration-500 ${activePipelineStep === 3 ? 'opacity-100 scale-105' : 'opacity-40'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${activePipelineStep === 3 ? 'bg-orange-500 text-white border-orange-500 shadow-[0_0_30px_orange]' : 'bg-transparent text-white border-white/20'}`}>
                       <span className="material-symbols-outlined text-2xl">local_fire_department</span>
                    </div>
                    <span className="text-xs font-mono uppercase tracking-widest">Heat</span>
                 </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 flex justify-between text-xs text-gray-500 font-mono">
                 <p className={activePipelineStep === 2 ? "text-verdant-pink transition-colors" : ""}>
                    {activePipelineStep === 2 ? ">>> GPU CLUSTERS SPINNING UP..." : "System Idle"}
                 </p>
                 <p>{activePipelineStep === 3 ? "240W DISSIPATED" : "..."}</p>
              </div>
           </div>
        </section>

        {/* SECTION 3: ENERGY VISUALS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
           <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">The Cost of "Just Asking"</h2>
              <p className="text-gray-400 leading-relaxed">
                 Generating a single image uses as much energy as fully charging your smartphone. 
                 A conversation with an LLM consumes enough electricity to power an LED lightbulb for hours.
                 When multiplied by billions, "efficiency" isn't a feature—it's survival.
              </p>
           </div>
           
           <div className="glass-panel p-6 rounded-xl space-y-6">
              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-mono text-gray-400">
                    <span>1 AI Image Gen</span>
                    <span className="text-white">Smartphone Charge</span>
                 </div>
                 <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-verdant-cyan to-blue-600"></div>
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-mono text-gray-400">
                    <span>100 LLM Queries</span>
                    <span className="text-white">1 Hour Gaming PC</span>
                 </div>
                 <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-gradient-to-r from-verdant-green to-emerald-600"></div>
                 </div>
              </div>

               <div className="space-y-2">
                 <div className="flex justify-between text-xs font-mono text-gray-400">
                    <span>1 Training Run</span>
                    <span className="text-white">100 US Homes / Year</span>
                 </div>
                 <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-verdant-pink to-red-600 animate-pulse-slow"></div>
                 </div>
              </div>
           </div>
        </section>

        {/* SECTION 4: WATER USAGE */}
        <section className="space-y-12">
           <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Thirsty Algorithms</h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                 Data centers drink water to stay cool. For every 20-50 questions you ask, a 500ml bottle of water evaporates into the cooling towers.
              </p>
           </div>

           <div className="flex justify-center">
              <div className="relative w-32 h-64 border-2 border-white/20 rounded-lg overflow-hidden glass-panel">
                 {/* Water Animation */}
                 <div className="absolute bottom-0 left-0 w-full bg-blue-500/50 animate-fill-up">
                    <div className="absolute top-0 left-0 w-full h-2 bg-white/30 animate-pulse"></div>
                 </div>
                 {/* Bubbles */}
                 <div className="absolute bottom-4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-[bounce_2s_infinite]"></div>
                 <div className="absolute bottom-8 right-1/4 w-3 h-3 bg-white/20 rounded-full animate-[bounce_3s_infinite_0.5s]"></div>
                 
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-xs font-bold text-white drop-shadow-md">COOLING...</span>
                 </div>
              </div>
           </div>
        </section>

        {/* SECTION 5: SCALING DANGER */}
        <section className="relative py-20 overflow-hidden border-y border-white/5">
           <div className="absolute inset-0 grid grid-cols-12 gap-1 opacity-20 pointer-events-none">
              {Array.from({ length: 144 }).map((_, i) => (
                 <div key={i} className={`bg-verdant-green rounded-sm animate-pulse`} style={{ animationDelay: `${Math.random() * 2}s`, opacity: Math.random() }}></div>
              ))}
           </div>
           
           <div className="relative z-10 text-center space-y-6 bg-black/80 backdrop-blur-sm p-8 rounded-xl max-w-2xl mx-auto border border-white/10">
              <h2 className="text-3xl font-bold text-white">The Multiplier Effect</h2>
              <p className="text-gray-300">
                 Efficiency isn't about saving one token. It's about what happens when that savings is multiplied by the 
                 <span className="text-verdant-green font-bold"> billions</span> of requests happening every day.
                 <br/><br/>
                 Small inefficiencies scale into massive environmental debts.
              </p>
           </div>
        </section>

        {/* SECTION 6: THE SIGNAL IN THE NOISE (INTRO TO SOLUTION) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
           <div className="order-2 md:order-1 relative h-[300px] bg-[#111] rounded-xl border border-white/10 p-6 font-mono text-xs overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full p-6 transition-all duration-500 group-hover:opacity-0 group-hover:scale-95">
                 <p className="text-red-400 mb-2">// RAW PROMPT (Inefficient)</p>
                 <p className="text-gray-500">
                    "Hey there AI, I was wondering if you could possibly help me out with writing a javascript function that basically takes a list of numbers and sorts them but make sure it handles errors too..."
                 </p>
                 <div className="mt-4 text-red-500/50">[TOKEN COUNT: HIGH] [LATENCY: HIGH]</div>
              </div>
              
              <div className="absolute top-0 left-0 w-full h-full p-6 bg-[#0A0A0A] opacity-0 scale-105 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100 flex flex-col justify-center">
                 <p className="text-verdant-green mb-2">// VERDANT OPTIMIZED</p>
                 <p className="text-white">
                    "Write robust JS sort function for number array. Handle errors."
                 </p>
                 <div className="mt-4 text-verdant-green/50">[TOKEN COUNT: LOW] [LATENCY: LOW]</div>
              </div>

              <div className="absolute bottom-4 right-4 text-gray-600 text-[10px] uppercase">Hover to optimize</div>
           </div>

           <div className="order-1 md:order-2 space-y-6">
              <h2 className="text-3xl font-bold text-white">The Signal in the Noise</h2>
              <p className="text-gray-400 leading-relaxed">
                 Most AI queries are 40-60% noise. Conversational filler, redundant context, and poor structuring force models to process more data than necessary.
              </p>
              <p className="text-gray-400">
                 By compressing intent before it hits the model, we cut compute cycles, reduce water usage, and lower carbon emissions—without losing meaning.
              </p>
           </div>
        </section>

        {/* SECTION 7: THE VERDANT PROTOCOL (HOW IT WORKS) */}
        <section className="space-y-12 py-12">
            <div className="text-center space-y-4">
                <h2 className="text-sm font-mono text-verdant-green uppercase tracking-[0.3em]">The Solution</h2>
                <h3 className="text-3xl font-bold text-white">The Verdant Protocol</h3>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    We don't just "monitor" carbon. We actively intervene in the inference pipeline to shave off waste at three critical layers.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Compression */}
                <div className="glass-panel p-6 rounded-xl border-t border-verdant-green/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl">compress</span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <span className="text-verdant-green">01.</span> Semantic Compression
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Our specialized NLP layer rewrites prompts to be machine-native, removing 30-50% of tokens (human conversational filler) without altering the output quality.
                    </p>
                    <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                         <div className="h-full w-[40%] bg-verdant-green"></div>
                    </div>
                    <p className="text-[10px] text-verdant-green mt-1 font-mono">40% TOKEN REDUCTION</p>
                </div>

                {/* Card 2: Arbitration */}
                <div className="glass-panel p-6 rounded-xl border-t border-verdant-cyan/20 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl">call_split</span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <span className="text-verdant-cyan">02.</span> Model Arbitration
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Not every query needs a Ph.D. level model. Verdant dynamically routes simple queries to efficient "Flash" models and complex ones to "Pro" models.
                    </p>
                     <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                         <div className="h-full w-[65%] bg-verdant-cyan"></div>
                    </div>
                    <p className="text-[10px] text-verdant-cyan mt-1 font-mono">65% ENERGY REDUCTION</p>
                </div>

                {/* Card 3: Caching */}
                 <div className="glass-panel p-6 rounded-xl border-t border-verdant-pink/20 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl">cached</span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <span className="text-verdant-pink">03.</span> Semantic Caching
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Why compute the same answer twice? We cache semantic vectors of previous queries, serving instant results with zero compute cost for recurring questions.
                    </p>
                     <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                         <div className="h-full w-[99%] bg-verdant-pink"></div>
                    </div>
                    <p className="text-[10px] text-verdant-pink mt-1 font-mono">100% ELIMINATION (ON HIT)</p>
                </div>
            </div>
        </section>

        {/* SECTION 8: PROOF OF IMPACT (GRAPH) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12 border-t border-white/5">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white">The Efficiency Gap</h2>
                <p className="text-gray-400 leading-relaxed">
                    When combining compression, routing, and caching, the energy profile of an AI product changes dramatically.
                </p>
                
                <div className="space-y-4 pt-4">
                     <div className="flex items-center justify-between p-4 rounded bg-white/5 border border-white/10">
                         <div>
                             <p className="text-xs text-gray-500 font-mono uppercase">Standard Pipeline</p>
                             <p className="text-xl text-white font-bold">4.2 Wh <span className="text-sm font-normal text-gray-500">/ query</span></p>
                         </div>
                         <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                             <span className="material-symbols-outlined text-red-500">warning</span>
                         </div>
                     </div>
                     
                     <div className="flex items-center justify-between p-4 rounded bg-verdant-green/5 border border-verdant-green/20">
                         <div>
                             <p className="text-xs text-verdant-green font-mono uppercase">Verdant Optimized</p>
                             <p className="text-xl text-white font-bold">1.1 Wh <span className="text-sm font-normal text-gray-500">/ query</span></p>
                         </div>
                         <div className="w-12 h-12 rounded-full bg-verdant-green/10 flex items-center justify-center border border-verdant-green/20">
                             <span className="material-symbols-outlined text-verdant-green">check_circle</span>
                         </div>
                     </div>
                </div>
            </div>

            <div className="h-[300px] glass-panel p-4 rounded-xl">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: 'Tokens', Standard: 1000, Verdant: 600 },
                        { name: 'Latency (ms)', Standard: 1200, Verdant: 450 },
                        { name: 'Energy (Wh)', Standard: 4.2, Verdant: 1.1 },
                    ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12, fontFamily: 'monospace'}} axisLine={false} tickLine={false} />
                        <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12, fontFamily: 'monospace'}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#333', borderRadius: '8px' }}
                            itemStyle={{ fontFamily: 'monospace' }}
                        />
                        <Bar dataKey="Standard" fill="#333" radius={[4, 4, 0, 0]} barSize={40} />
                        <Bar dataKey="Verdant" fill="#00ff00" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
                 <div className="flex justify-center gap-6 mt-4 text-[10px] font-mono uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-[#333] rounded-sm"></span> Standard
                    </div>
                     <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-verdant-green rounded-sm"></span> Verdant
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 9: CTA */}
        <section className="text-center py-20 space-y-8">
           <div className="inline-block p-[2px] rounded-full bg-gradient-to-r from-verdant-green via-verdant-cyan to-verdant-green">
               <button 
                   onClick={() => onNavigate(AppView.DASHBOARD)}
                   className="px-8 py-3 rounded-full bg-black text-white hover:bg-gray-900 transition-colors flex items-center gap-2 font-bold uppercase tracking-widest text-sm"
               >
                   Start Optimizing <span className="material-symbols-outlined text-sm">arrow_forward</span>
               </button>
           </div>
           <p className="text-gray-500 text-xs font-mono">
               Join 4,500+ engineers building a cleaner web.
           </p>
        </section>

      </div>
    </div>
  );
};

// 5. MAIN APP CONTROLLER
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // Lifted Config State
  const [config, setConfig] = useState<OptimizationConfig>({
    model: 'gemini-3-flash-preview',
    temperature: 0.7,
    autoPilot: false,
  });

  // Simple Router
  const renderView = () => {
    switch (currentView) {
      case AppView.LOGIN:
        return <LoginScreen onLogin={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.DASHBOARD:
        return <DashboardScreen onOpenConfig={() => setIsConfigOpen(true)} config={config} setConfig={setConfig} />;
      case AppView.GALLERY:
        return <GalleryScreen />;
      case AppView.ABOUT:
        return <AboutScreen onNavigate={setCurrentView} />;
      default:
        return <LoginScreen onLogin={() => setCurrentView(AppView.DASHBOARD)} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView}
      showNav={currentView !== AppView.LOGIN}
    >
      {renderView()}
      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        config={config} 
        setConfig={setConfig} 
      />
    </Layout>
  );
};

export default App;