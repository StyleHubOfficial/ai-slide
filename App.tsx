
import React, { useState } from 'react';
import { generatePresentation } from './services/geminiService';
import { Presentation, PresentationStyle } from './types';
import CreationStudio from './components/CreationStudio';
import PresentationView from './components/PresentationView';
import GlassCard from './components/ui/GlassCard';
import Button from './components/ui/Button';
import XIcon from './components/icons/XIcon';

function App() {
  const [view, setView] = useState<'CREATE' | 'PRESENT'>('CREATE');
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (topic: string, style: PresentationStyle, fileContext: string, slideCount: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generatePresentation({ topic, style, fileContext, slideCount });
      setPresentation(data);
      setView('PRESENT');
    } catch (err) {
      console.error("Creation failed:", err);
      const msg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePresentation = () => {
    if (window.confirm("Are you sure you want to close? You will lose this deck.")) {
      setView('CREATE');
      setPresentation(null);
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <GlassCard className="max-w-md w-full border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                System Error
              </h3>
              <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-slate-300 mb-6 leading-relaxed">
              {error}
            </p>
            
            <div className="flex justify-end">
              <Button onClick={() => setError(null)} className="bg-slate-800 hover:bg-slate-700">
                Dismiss
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {view === 'CREATE' && (
        <CreationStudio onCreate={handleCreate} isLoading={isLoading} />
      )}
      {view === 'PRESENT' && presentation && (
        <PresentationView presentation={presentation} onClose={handleClosePresentation} />
      )}
    </div>
  );
}

export default App;
