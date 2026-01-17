import React from 'react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  showNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, showNav = true }) => {
  if (!showNav) {
    return (
      <div className="relative min-h-screen bg-verdant-bg text-white font-display overflow-x-hidden selection:bg-verdant-green selection:text-black">
        <div className="noise"></div>
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-verdant-bg text-white font-display flex flex-col overflow-x-hidden selection:bg-verdant-green selection:text-black">
      <div className="noise"></div>
      
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-[#0F003D] rounded-full blur-[120px] opacity-60 mix-blend-screen"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-[#3D0F3D] rounded-full blur-[100px] opacity-40 mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] bg-verdant-green rounded-full blur-[150px] opacity-5"></div>
        <div className="absolute inset-0 grid-bg opacity-30"></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 w-full border-b border-border-highlight bg-verdant-bg/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer active:scale-95 transition-transform" onClick={() => onNavigate(AppView.DASHBOARD)}>
            <div className="w-8 h-8 rounded-lg bg-verdant-green/10 flex items-center justify-center border border-verdant-green/20 group-hover:border-verdant-green/50 group-hover:shadow-verdant-glow transition-all duration-300">
              <span className="material-symbols-outlined text-verdant-green text-[20px]">eco</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white group-hover:text-verdant-green transition-colors">Verdant-Route</h1>
          </div>

          <div className="hidden md:flex items-center bg-white/5 rounded-lg p-1 border border-border-highlight">
            <button 
              onClick={() => onNavigate(AppView.DASHBOARD)}
              className={`px-6 py-1.5 rounded text-sm font-medium transition-all duration-300 active:scale-95 ${
                currentView === AppView.DASHBOARD 
                ? 'bg-white/10 text-white shadow-verdant-glow border border-verdant-green/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 hover:border-verdant-green/20'
              }`}
            >
              Optimization
            </button>
            <button 
              onClick={() => onNavigate(AppView.GALLERY)}
              className={`px-6 py-1.5 rounded text-sm font-medium transition-all duration-300 active:scale-95 ${
                currentView === AppView.GALLERY 
                ? 'bg-white/10 text-white shadow-verdant-glow border border-verdant-green/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 hover:border-verdant-green/20'
              }`}
            >
              Gallery
            </button>
            <button 
              onClick={() => onNavigate(AppView.ABOUT)}
              className={`px-6 py-1.5 rounded text-sm font-medium transition-all duration-300 active:scale-95 ${
                currentView === AppView.ABOUT 
                ? 'bg-white/10 text-white shadow-verdant-glow border border-verdant-green/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 hover:border-verdant-green/20'
              }`}
            >
              Mission
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-border-highlight hover:border-verdant-green/30 hover:shadow-verdant-glow transition-all duration-300">
              <span className="material-symbols-outlined text-verdant-green text-[18px]">cloud_off</span>
              <span className="text-xs font-mono text-gray-300"><span className="text-verdant-green font-bold">12.4kg</span> CO2e Saved</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-[1600px] w-full mx-auto flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-verdant-bg/90 backdrop-blur border-t border-white/10 z-50 h-8 flex items-center justify-between px-6">
        <div className="flex items-center gap-4 h-full">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verdant-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-verdant-green"></span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Verdant Engine: <span className="text-verdant-green">ACTIVE</span></span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span className="text-[10px] text-gray-600 font-mono">System: Operational</span>
          <span className="text-[10px] text-gray-600 font-mono">v1.2.5</span>
        </div>
      </footer>
    </div>
  );
};