
import React, { useState, useEffect } from 'react';
import { Presentation } from '../types';
import { SlideRenderer } from './SlideRenderers';
import Button from './ui/Button';
import XIcon from './icons/XIcon';

interface PresentationViewProps {
  presentation: Presentation;
  onClose: () => void;
}

const PresentationView: React.FC<PresentationViewProps> = ({ presentation, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextSlide = () => {
    if (currentSlideIndex < presentation.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex]);

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col h-screen w-screen">
      
      {/* Toolbar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
           <button onClick={onClose} className="hover:text-red-400 transition-colors"><XIcon className="w-6 h-6" /></button>
           <h2 className="font-bold text-slate-300 truncate max-w-md">{presentation.title}</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
           <span>{currentSlideIndex + 1} / {presentation.slides.length}</span>
           <div className="h-4 w-px bg-slate-700 mx-2"></div>
           <button onClick={() => alert('Export feature coming soon!')} className="hover:text-white transition-colors">Export PDF</button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Thumbnails */}
        <div className="w-64 bg-slate-950 border-r border-slate-800 overflow-y-auto hidden md:block p-4 space-y-4">
           {presentation.slides.map((slide, idx) => (
             <div 
                key={slide.id} 
                onClick={() => setCurrentSlideIndex(idx)}
                className={`w-full aspect-video bg-slate-900 rounded border-2 cursor-pointer relative transition-all transform hover:scale-105 ${idx === currentSlideIndex ? 'border-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.3)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
             >
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 uppercase font-bold pointer-events-none select-none">
                  {slide.type}
                </div>
             </div>
           ))}
        </div>

        {/* Stage */}
        <div className="flex-1 bg-black relative flex items-center justify-center p-4 md:p-8">
          
          <div className="w-full max-w-6xl aspect-video bg-slate-900 shadow-2xl overflow-hidden relative border border-slate-800 rounded-sm">
            <SlideRenderer slide={presentation.slides[currentSlideIndex]} style={presentation.style} />
          </div>

          {/* Navigation Overlays */}
          <button 
            onClick={prevSlide}
            disabled={currentSlideIndex === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/20 hover:bg-white/10 rounded-full backdrop-blur-sm disabled:opacity-0 transition-all"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <button 
            onClick={nextSlide}
            disabled={currentSlideIndex === presentation.slides.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-black/20 hover:bg-white/10 rounded-full backdrop-blur-sm disabled:opacity-0 transition-all"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

        </div>
      </div>
    </div>
  );
};

export default PresentationView;
