import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ConfigModal } from './components/ConfigModal';
import { PromptLinterPanel } from './components/PromptLinterPanel'; // Kept just in case, though likely unused in App.tsx now
import { EfficiencyIndicator } from './components/EfficiencyIndicator';
import { AppView, PromptTemplate, OptimizationConfig } from './types';
import { registerUser, loginUser } from './services/geminiService';
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { DashboardScreen } from './components/DashboardScreen';
import { TEMPLATE_DATABASE } from './data/mockData';
import { copyToClipboard, shareContent } from './utils/uiUtils';

// --- AUTH SERVICE (CONNECTED TO BACKEND) ---
const authService = {
  register: async (email: string, password: string) => {
    return await registerUser(email, password);
  },
  login: async (email: string, password: string) => {
    return await loginUser(email, password);
  }
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
          <span className="font-mono text-sm tracking-widest text-white font-bold uppercase">ERDE-GreenAI</span>
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
            <span className="material-symbols-outlined text-white text-[18px]">public</span>
            <div>
              <span className="block text-white font-bold uppercase">Carbon-Aware Inference</span>
              <span className="text-[10px] opacity-60">PLANETARY SCALE OPTIMIZATION</span>
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
            <span>STABLE CORE v1.0</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-verdant-green"></span> SYSTEM ONLINE</span>
          </div>
        </div>
      </section>
    </div>
  );
};



// 3. GALLERY SCREEN
const GalleryScreen = ({ onSelectTemplate }: { onSelectTemplate: (prompt: string, model?: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // -- Filters State --
  const [filterModel, setFilterModel] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterRating, setFilterRating] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // -- Mapping UI labels to Data values --
  const CATEGORY_MAP: { [key: string]: string } = {
    'Code Generation': 'Development',
    'Data Extraction': 'Extraction',
    'Analysis': 'Analysis',
    'Creative Writing': 'Drafting'
  };

  const MODEL_MAP: { [key: string]: string } = {
    'Gemini 3.0 Pro': 'gemini-3-pro',
    'Gemini 3.0 Flash': 'gemini-3-flash',
    'Gemini 2.5 Flash': 'gemini-2.5-flash'
  };

  const filteredTemplates = TEMPLATE_DATABASE.filter(t => {
    // 1. Search Query
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Model Filter
    const matchesModel = filterModel ? t.models.some(m => m.includes(MODEL_MAP[filterModel])) : true;

    // 3. Category Filter
    let matchesCategory = true;
    if (filterCategory !== 'All') {
      matchesCategory = t.category === CATEGORY_MAP[filterCategory] || t.category === filterCategory;
    }

    // 4. Rating Filter
    const matchesRating = filterRating ? t.rating.startsWith(filterRating) : true;

    return matchesSearch && matchesModel && matchesCategory && matchesRating;
  });

  const handleCopy = async (e: React.MouseEvent, template: PromptTemplate) => {
    e.stopPropagation();
    const textToCopy = template.prompt || '';
    if (!textToCopy) {
      showToast("No prompt available for this template.");
      return;
    }
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopiedId(template.id);
      showToast("Prompt copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleShare = async (e: React.MouseEvent, template: PromptTemplate) => {
    e.stopPropagation();
    const textToShare = template.prompt || '';
    if (!textToShare) {
      showToast("No prompt available for this template.");
      return;
    }

    const shared = await shareContent(
      textToShare,
      `ERDE-GreenAI: ${template.title}`,
      async () => {
        const success = await copyToClipboard(textToShare);
        if (success) {
          setCopiedId(template.id);
          showToast("Prompt copied to clipboard!");
          setTimeout(() => setCopiedId(null), 2000);
        }
      }
    );
    if (shared) {
      showToast("Prompt shared successfully!");
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full animate-fade-in relative">
      {toast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-verdant-cyan text-black px-4 py-2 rounded-full font-bold text-xs shadow-cyan-glow animate-bounce-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">share</span>
          {toast}
        </div>
      )}
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-highlight p-6 flex flex-col gap-8 hidden lg:flex overflow-y-auto custom-scrollbar">

        {/* Filter: Models */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">AI Models</h3>
            {filterModel && (
              <button onClick={() => setFilterModel(null)} className="text-[10px] text-gray-500 hover:text-white hover:underline">Clear</button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {Object.keys(MODEL_MAP).map((m) => {
              const isActive = filterModel === m;
              return (
                <label
                  key={m}
                  className={`flex items-center gap-3 group cursor-pointer active:scale-[0.98] transition-all p-2 rounded -mx-2 ${isActive ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}
                  onClick={() => setFilterModel(isActive ? null : m)}
                >
                  <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${isActive ? 'border-verdant-green bg-verdant-green/10' : 'border-white/20 group-hover:border-verdant-green'}`}>
                    {isActive && <div className="w-2 h-2 bg-verdant-green rounded-sm"></div>}
                  </div>
                  <span className={`text-sm transition-colors ${isActive ? 'text-white font-medium' : 'text-gray-300 group-hover:text-white'}`}>{m}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filter: Purpose */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Purpose</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setFilterCategory('All')}
              className={`flex items-center justify-between px-3 py-2 rounded border text-sm text-left shadow-sm transition-all duration-200 ${filterCategory === 'All'
                ? 'bg-white/10 border-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]'
                : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              <span>All Templates</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${filterCategory === 'All' ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-600'}`}>{TEMPLATE_DATABASE.length}</span>
            </button>

            {Object.keys(CATEGORY_MAP).map(c => {
              const isActive = filterCategory === c;
              const count = TEMPLATE_DATABASE.filter(t => t.category === CATEGORY_MAP[c]).length;
              return (
                <button
                  key={c}
                  onClick={() => setFilterCategory(c)}
                  className={`flex items-center justify-between px-3 py-2 rounded text-sm transition-all active:scale-[0.98] text-left border ${isActive
                    ? 'bg-white/10 border-verdant-cyan/30 text-verdant-cyan shadow-[0_0_10px_rgba(0,191,255,0.1)]'
                    : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <span>{c}</span>
                  <span className={`text-[10px] font-mono ${isActive ? 'text-verdant-cyan' : 'text-gray-600'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter: Rating */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Carbon Rating</h3>
            {filterRating && (
              <button onClick={() => setFilterRating(null)} className="text-[10px] text-gray-500 hover:text-white hover:underline">Clear</button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterRating(filterRating === 'A+' ? null : 'A+')}
              className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${filterRating === 'A+'
                ? 'border-verdant-green bg-verdant-green text-black shadow-verdant-glow'
                : 'border-verdant-green/20 bg-verdant-green/5 text-verdant-green hover:bg-verdant-green/10'
                }`}
            >
              A+ (Low)
            </button>
            <button
              onClick={() => setFilterRating(filterRating === 'A' ? null : 'A')} // Simplified logic, 'A' startsWith 'A' so it might match 'A+' too if not careful, but visually simpler.
              className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${filterRating === 'A'
                ? 'border-white bg-white text-black'
                : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
            >
              A (Medium)
            </button>
            <button
              onClick={() => setFilterRating(filterRating === 'B' ? null : 'B')}
              className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${filterRating === 'B'
                ? 'border-yellow-500 bg-yellow-500 text-black'
                : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-yellow-200'
                }`}
            >
              B (High)
            </button>
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => showToast("Submissions coming soon! Join the waitlist.")}
              className="flex items-center gap-2 bg-verdant-green/10 hover:bg-verdant-green text-verdant-green hover:text-black px-4 py-2 rounded border border-verdant-green/20 transition-all text-xs font-bold uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Add to Gallery
            </button>
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
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 animate-fade-in">
            <span className="material-symbols-outlined text-4xl mb-4">search_off</span>
            <p className="text-sm font-mono">No templates found matching filters.</p>
            <button onClick={() => { setSearchQuery(''); setFilterCategory('All'); setFilterModel(null); setFilterRating(null); }} className="mt-4 text-verdant-green hover:underline text-xs">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
            {filteredTemplates.map((t) => (
              <div key={t.id} className="glass-panel p-6 rounded group hover:bg-white/[0.06] transition-all duration-200 active:scale-[0.98] cursor-pointer border border-transparent hover:border-verdant-green/50 hover:shadow-verdant-glow relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <span className={`text-[10px] border px-2 py-1 rounded font-mono uppercase tracking-wider 
                      ${t.category === 'Research' ? 'bg-blue-900/30 text-blue-300 border-blue-500/20' :
                        t.category === 'Extraction' ? 'bg-cyan-900/30 text-cyan-300 border-cyan-500/20' :
                          t.category === 'Analysis' ? 'bg-pink-900/30 text-pink-300 border-pink-500/20' :
                            t.category === 'Development' ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500/20' :
                              'bg-purple-900/30 text-purple-300 border-purple-500/20'}`}>
                      {t.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-green-900/20 px-2 py-1 rounded border border-green-500/20">
                    {(t.rating === 'A+' || t.rating === 'A') && <span className="w-1.5 h-1.5 rounded-full bg-verdant-green animate-pulse"></span>}
                    <span className={`text-[10px] font-bold ${t.rating.includes('A') ? 'text-verdant-green' : 'text-yellow-400'}`}>{t.rating}</span>
                  </div>
                </div>
                <h4 className={`text-lg font-semibold text-white mb-2 transition-colors ${t.category === 'Research' ? 'group-hover:text-blue-300' :
                  t.category === 'Extraction' ? 'group-hover:text-cyan-300' :
                    'group-hover:text-verdant-green'
                  }`}>{t.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-2 mb-6 group-hover:text-gray-300 transition-colors">{t.description}</p>

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
                      <div key={i} title={m} className="w-6 h-6 rounded border border-[#050505] bg-gray-800 flex items-center justify-center hover:scale-110 transition-transform z-10">
                        <span className="material-symbols-outlined text-[14px] text-gray-400">
                          {m.includes('pro') ? 'psychology' : 'bolt'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleCopy(e, t)}
                      className="text-gray-500 hover:text-verdant-cyan transition-colors p-1 rounded hover:bg-white/5"
                      title="Copy Prompt"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {copiedId === t.id ? 'check' : 'content_copy'}
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTemplate(t.prompt, t.models[0]);
                      }}
                      className="bg-verdant-green/10 hover:bg-verdant-green text-verdant-green hover:text-black px-3 py-1.5 rounded-full border border-verdant-green/20 transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                      Use Template
                    </button>
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
  const [queriesPerDay, setQueriesPerDay] = useState(150);

  const annualWaterSaved = Math.round(queriesPerDay * 0.3 * 0.05 * 365);
  const annualCarbonSaved = (queriesPerDay * 0.3 * 0.0002 * 365).toFixed(1);

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
              The <span className="text-verdant-green">Green</span><br />
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
              <p>System State: {activePipelineStep === 2 ? "High Compute Utilization" : "Idle"}</p>
              <p>Resource Tracking: Active</p>
            </div>
          </div>
        </section>

        {/* SECTION 4: SAVINGS CALCULATOR */}
        <section className="bg-verdant-green/5 border border-verdant-green/20 rounded-2xl p-8 md:p-12 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-[120px]">calculate</span>
          </div>

          <div className="max-w-xl space-y-4 relative z-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">Personal Impact Calculator</h2>
            <p className="text-gray-400">Estimate your annual contribution to a greener planet by switching to disciplined prompt engineering.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-white uppercase tracking-wider">Daily Queries</label>
                  <span className="text-verdant-green font-mono text-xl">{queriesPerDay}</span>
                </div>
                <input
                  type="range" min="10" max="1000" step="10"
                  value={queriesPerDay}
                  onChange={(e) => setQueriesPerDay(parseInt(e.target.value))}
                  className="w-full accent-verdant-green bg-gray-800 h-2 rounded-lg appearance-none cursor-pointer"
                  id="querySlider"
                />
                <div className="flex justify-between text-[10px] font-mono text-gray-600">
                  <span>10 q/day</span>
                  <span>1000 q/day</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-xl border-verdant-cyan/20">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Annual Water Saved</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-verdant-cyan font-mono">{annualWaterSaved.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-600">Liters</span>
                </div>
              </div>
              <div className="glass-panel p-4 rounded-xl border-verdant-green/20 shadow-verdant-glow/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Carbon Offset</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-verdant-green font-mono">{annualCarbonSaved}</span>
                  <span className="text-[10px] text-gray-600">kg CO2e</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500 italic">"Small optimizations at scale create massive environmental shifts."</p>
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
              <br /><br />
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
              <p className="text-verdant-green mb-2">// ERDE OPTIMIZED</p>
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
            <h3 className="text-3xl font-bold text-white">The ERDE Protocol</h3>
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
                Not every query needs a Ph.D. level model. ERDE dynamically routes simple queries to efficient "Flash" models and complex ones to "Pro" models.
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
                  <p className="text-xs text-verdant-green font-mono uppercase">ERDE Optimized</p>
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
                { name: 'Tokens', Standard: 1000, ERDE: 600 },
                { name: 'Latency (ms)', Standard: 1200, ERDE: 450 },
                { name: 'Energy (Wh)', Standard: 4.2, ERDE: 1.1 },
              ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#333', borderRadius: '8px' }}
                  itemStyle={{ fontFamily: 'monospace' }}
                />
                <Bar dataKey="Standard" fill="#333" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="ERDE" fill="#00ff00" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4 text-[10px] font-mono uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#333] rounded-sm"></span> Standard
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-verdant-green rounded-sm"></span> ERDE
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
          <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">
            Efficiency is the only path to sustainable intelligence.
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
    apiKey: '',
    anticipatoryMode: false,
    outputLengthConstraint: undefined,
    answerDepth: 'Concise',
    optimizationMode: 'Concise',
  });

  const [prompt, setPrompt] = useState('');

  const handleSelectTemplate = (templatePrompt: string, model?: string) => {
    setPrompt(templatePrompt);
    if (model) {
      // Map data labels to config values
      let configModel = model;
      if (model === 'gemini-3-pro') configModel = 'gemini-3-pro-preview';
      if (model === 'gemini-3-flash') configModel = 'gemini-3-flash-preview';
      if (model === 'gemini-2.5-flash') configModel = 'gemini-2.5-flash-latest';

      setConfig(prev => ({ ...prev, model: configModel }));
    }
    setCurrentView(AppView.DASHBOARD);
  };

  // Simple Router
  const renderView = () => {
    switch (currentView) {
      case AppView.LOGIN:
        return <LoginScreen onLogin={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.DASHBOARD:
        return <DashboardScreen
          onOpenConfig={() => setIsConfigOpen(true)}
          config={config}
          setConfig={setConfig}
          prompt={prompt}
          setPrompt={setPrompt}
        />;
      case AppView.GALLERY:
        return <GalleryScreen onSelectTemplate={handleSelectTemplate} />;
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