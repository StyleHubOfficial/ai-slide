import React, { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  type: 'architect' | 'convert';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ type }) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const architectMessages = [
    "Initializing Neural Core...",
    "Analyzing Prompt Semantics...",
    "Structuring Presentation Logic...",
    "Designing Slide Layouts...",
    "Generating Cinematic Visuals...",
    "Finalizing Animations..."
  ];

  const convertMessages = [
    "Scanning Document...",
    "Extracting Text Data...",
    "Synthesizing Key Insights...",
    "Formatting Slides...",
    "Optimizing Visual Hierarchy...",
    "Rendering Output..."
  ];

  const messages = type === 'architect' ? architectMessages : convertMessages;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        // Non-linear progress to feel more "real"
        return prev + Math.random() * 3;
      });
    }, 150);

    const msgInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 1800);

    return () => {
      clearInterval(interval);
      clearInterval(msgInterval);
    };
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      {type === 'architect' ? (
        /* ARCHITECT MODE ANIMATION */
        <div className="relative w-64 h-64 flex items-center justify-center mb-12">
          {/* Core */}
          <div className="absolute w-24 h-24 bg-sky-500/20 rounded-full blur-md animate-pulse"></div>
          <div className="absolute w-16 h-16 bg-sky-400 rounded-full shadow-[0_0_40px_rgba(56,189,248,0.6)]"></div>
          
          {/* Orbiting Rings */}
          <div className="absolute w-full h-full rounded-full border border-sky-500/30 border-t-sky-400 animate-spin-slow"></div>
          <div className="absolute w-[80%] h-[80%] rounded-full border border-indigo-500/30 border-b-indigo-400 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '6s' }}></div>
          <div className="absolute w-[120%] h-[120%] rounded-full border border-dashed border-slate-700/50 animate-spin-slow" style={{ animationDuration: '20s' }}></div>
          
          {/* Particles */}
          <div className="absolute top-0 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white] animate-ping-slow"></div>
        </div>
      ) : (
        /* CONVERT MODE ANIMATION */
        <div className="relative w-48 h-64 mb-12 border-2 border-emerald-500/30 rounded-lg bg-slate-900/50 overflow-hidden flex flex-col items-center justify-center">
           {/* Document Outline */}
           <div className="w-24 h-32 border-2 border-slate-700 rounded bg-slate-800/50 relative">
              {/* Text Lines */}
              <div className="w-16 h-1 bg-slate-600 m-2 mb-4"></div>
              <div className="w-20 h-1 bg-slate-600 m-2"></div>
              <div className="w-18 h-1 bg-slate-600 m-2"></div>
              <div className="w-14 h-1 bg-slate-600 m-2"></div>
              
              {/* Scan Laser */}
              <div className="absolute w-full h-2 bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-scan-vertical blur-[1px]"></div>
           </div>
           
           {/* Binary Rain Background */}
           <div className="absolute inset-0 flex justify-between px-2 opacity-20 pointer-events-none">
              {[...Array(5)].map((_, i) => (
                 <div key={i} className="text-[8px] text-emerald-400 font-mono animate-data-flow" style={{ animationDelay: `${i * 0.3}s` }}>
                    10110<br/>01001<br/>11010
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* Status Text */}
      <div className="z-10 text-center space-y-2">
         <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
            {type === 'architect' ? 'Architecting...' : 'Converting...'}
         </h2>
         <p className="text-sky-400 font-mono text-sm md:text-base h-6">
            {messages[messageIndex]}
         </p>
      </div>

      {/* Progress Bar */}
      <div className="mt-8 w-64 h-1 bg-slate-800 rounded-full overflow-hidden relative">
         <div 
            className={`h-full transition-all duration-200 ease-out ${type === 'architect' ? 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
         ></div>
      </div>
      
      <p className="mt-2 text-xs text-slate-500 font-mono">{Math.floor(Math.min(progress, 99))}%</p>

    </div>
  );
};

export default LoadingOverlay;