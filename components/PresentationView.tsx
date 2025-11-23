
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Presentation, PresentationStyle, TransitionStyle } from '../types';
import { SlideRenderer, getAIImageUrl } from './SlideRenderers';
import { communityService } from '../services/communityService';
import Button from './ui/Button';
import Select from './ui/Select';
import XIcon from './icons/XIcon';
import PresenterIcon from './icons/PresenterIcon';
import ShareIcon from './icons/ShareIcon';
import PptxGenJS from 'pptxgenjs';
import Spinner from './ui/Spinner';

interface PresentationViewProps {
  presentation: Presentation;
  onClose: () => void;
}

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

const imageToBase64 = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (e) { return null; }
}

const THEMES = [
    { id: PresentationStyle.NeonGrid, label: 'Neon' },
    { id: PresentationStyle.DarkDots, label: 'Dots' },
    { id: PresentationStyle.SoftGradient, label: 'Flow' },
    { id: PresentationStyle.GeoPoly, label: 'Geo' },
    { id: PresentationStyle.Minimalist, label: 'Light' },
];

const PresentationView: React.FC<PresentationViewProps> = ({ presentation, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'SLIDE' | 'GRID' | 'PRESENTER'>('SLIDE');
  const [isLaserMode, setIsLaserMode] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  
  // UI State
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeStyle, setActiveStyle] = useState<PresentationStyle>(presentation.style);
  const [transition, setTransition] = useState<TransitionStyle>('glitch');
  const [isExportingPPT, setIsExportingPPT] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => setElapsedTime(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => { if (currentSlideIndex < presentation.slides.length - 1) setCurrentSlideIndex(prev => prev + 1); };
  const prevSlide = () => { if (currentSlideIndex > 0) setCurrentSlideIndex(prev => prev - 1); };

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || viewMode === 'GRID') return;
      const { clientWidth, clientHeight } = containerRef.current;
      setScale(Math.min(clientWidth / BASE_WIDTH, clientHeight / BASE_HEIGHT) * 0.98); 
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const handleMouseMove = (e: React.MouseEvent) => { if (isLaserMode) setLaserPos({ x: e.clientX, y: e.clientY }); };

  const handleShareToCommunity = () => {
        if (confirm("Publish this presentation to the Community Hub?")) {
            communityService.publishDeck({ ...presentation, style: activeStyle }, 'You');
            alert("Published successfully!");
        }
  };
  
  const handleDownloadPDF = () => { setShowDownloadMenu(false); setTimeout(() => window.print(), 300); };

  const handleExportPPT = async () => {
    if (isExportingPPT) return;
    setIsExportingPPT(true);
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      
      const colors = getPPTXColors(activeStyle);

      for (const slide of presentation.slides) {
        const pptSlide = pptx.addSlide();
        pptSlide.background = { color: colors.bg };
        
        if (slide.imagePrompt) {
            const b64 = await imageToBase64(getAIImageUrl(slide.imagePrompt));
            if (b64) pptSlide.addImage({ data: b64, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover', w: '100%', h: '100%' } });
        }
        
        pptSlide.addText(slide.title || "Untitled", { x: 0.5, y: 0.5, w: '90%', fontSize: 36, color: colors.text, align: 'center', bold: true });
        if (slide.bulletPoints) {
            slide.bulletPoints.forEach((p, i) => pptSlide.addText(p, { x: 1, y: 2 + (i * 0.7), w: '80%', fontSize: 20, color: colors.text, bullet: true }));
        }
      }
      await pptx.writeFile({ fileName: `${presentation.title}_Lakshya.pptx` });
    } catch (e) { alert("PPT Export Failed"); } 
    finally { setIsExportingPPT(false); setShowDownloadMenu(false); }
  };

  const currentSlide = presentation.slides[currentSlideIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col h-full w-full overflow-hidden select-none">
      
      {/* Hidden Print Container */}
      <div className="print-only">
         {presentation.slides.map(slide => (
            <div key={slide.id} className="slide-print-wrapper">
               <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                 <SlideRenderer slide={slide} style={activeStyle} />
               </div>
            </div>
         ))}
      </div>

      {/* --- DESKTOP TOOLBAR --- */}
      <div className="no-print hidden md:flex h-16 bg-slate-900/90 border-b border-white/10 items-center justify-between px-6 shrink-0 z-50">
          <div className="flex items-center gap-6">
             <button onClick={onClose} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold"><XIcon className="w-4 h-4" /> EXIT</button>
             <h2 className="font-bold text-slate-200 truncate max-w-[200px]">{presentation.title}</h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                <button onClick={() => setViewMode('SLIDE')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode === 'SLIDE' ? 'bg-sky-600' : 'text-slate-400'}`}>Slide</button>
                <button onClick={() => setViewMode('GRID')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode === 'GRID' ? 'bg-sky-600' : 'text-slate-400'}`}>Grid</button>
                <button onClick={() => setViewMode('PRESENTER')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode === 'PRESENTER' ? 'bg-sky-600' : 'text-slate-400'}`}><PresenterIcon className="w-3 h-3 inline mr-1"/>Presenter</button>
             </div>
             <button onClick={() => setIsLaserMode(!isLaserMode)} className={`p-2 rounded-lg ${isLaserMode ? 'bg-red-500/20 text-red-400' : 'text-slate-400'}`} title="Laser Pointer"><div className="w-3 h-3 rounded-full bg-current shadow-sm"></div></button>
             
             {/* THEME PICKER */}
             <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
                 {THEMES.map(t => (
                     <button 
                        key={t.id} 
                        onClick={() => setActiveStyle(t.id)} 
                        className={`px-2 py-1 text-[10px] rounded font-bold transition-all ${activeStyle === t.id ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-white'}`}
                     >
                         {t.label}
                     </button>
                 ))}
             </div>

             <button onClick={handleShareToCommunity} className="p-2 text-pink-400 hover:bg-pink-500/20 rounded"><ShareIcon className="w-4 h-4" /></button>
             
             <div className="relative">
                <Button onClick={() => setShowDownloadMenu(!showDownloadMenu)} className="h-8 px-3 text-xs bg-sky-600">Download</Button>
                {showDownloadMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                        <button onClick={handleDownloadPDF} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 text-slate-300">PDF</button>
                        <button onClick={handleExportPPT} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 text-slate-300">PPTX {isExportingPPT && '...'}</button>
                    </div>
                )}
             </div>
          </div>
      </div>

      {/* --- MAIN STAGE --- */}
      <div className="no-print flex-1 relative bg-black overflow-hidden flex flex-col" ref={containerRef} onMouseMove={handleMouseMove}>
        
        {/* Mobile Header Overlay */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-[60] p-4 flex justify-between pointer-events-none">
            <button onClick={onClose} className="pointer-events-auto p-2 rounded-full bg-black/50 text-white/80 backdrop-blur border border-white/10"><XIcon className="w-5 h-5" /></button>
            <div className="pointer-events-auto flex gap-2">
                 <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="px-3 py-1 rounded-full bg-black/50 text-white/80 backdrop-blur border border-white/10 text-xs font-bold flex items-center gap-1">
                    {viewMode === 'SLIDE' ? 'Options' : 'Close Menu'}
                 </button>
            </div>
        </div>

        {/* Mobile "More Options" Menu - Parity with Desktop */}
        {showMobileMenu && (
            <div className="md:hidden absolute top-16 right-4 z-[70] w-64 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-4 animate-fade-in-up">
                 <div className="grid grid-cols-3 gap-2 mb-4">
                     <button onClick={() => setViewMode('SLIDE')} className={`p-2 rounded text-xs font-bold text-center border ${viewMode === 'SLIDE' ? 'bg-sky-600 border-sky-500' : 'border-white/10'}`}>Slide</button>
                     <button onClick={() => setViewMode('GRID')} className={`p-2 rounded text-xs font-bold text-center border ${viewMode === 'GRID' ? 'bg-sky-600 border-sky-500' : 'border-white/10'}`}>Grid</button>
                     <button onClick={() => setViewMode('PRESENTER')} className={`p-2 rounded text-xs font-bold text-center border ${viewMode === 'PRESENTER' ? 'bg-sky-600 border-sky-500' : 'border-white/10'}`}>Presenter</button>
                 </div>
                 
                 <div className="mb-4">
                     <p className="text-xs text-slate-500 font-bold mb-2">VISUAL THEME</p>
                     <div className="grid grid-cols-5 gap-1">
                         {THEMES.map(t => (
                             <button 
                                key={t.id} 
                                onClick={() => setActiveStyle(t.id)} 
                                className={`w-full aspect-square rounded flex items-center justify-center text-[10px] font-bold border ${activeStyle === t.id ? 'bg-sky-500 text-white border-sky-400' : 'bg-white/5 text-slate-400 border-transparent'}`}
                             >
                                 {t.label.charAt(0)}
                             </button>
                         ))}
                     </div>
                 </div>

                 <div className="flex justify-between items-center mb-4 p-2 bg-white/5 rounded-lg">
                     <span className="text-xs font-bold">Laser Pointer</span>
                     <button onClick={() => setIsLaserMode(!isLaserMode)} className={`w-8 h-4 rounded-full relative transition-colors ${isLaserMode ? 'bg-red-500' : 'bg-slate-700'}`}>
                         <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isLaserMode ? 'left-4.5' : 'left-0.5'}`}></div>
                     </button>
                 </div>
                 
                 <div className="space-y-2">
                     <button onClick={handleShareToCommunity} className="w-full py-2 rounded bg-pink-600/20 text-pink-400 text-xs font-bold border border-pink-500/20">Share to Community</button>
                     <button onClick={handleDownloadPDF} className="w-full py-2 rounded bg-white/5 text-slate-300 text-xs font-bold">Download PDF</button>
                     <button onClick={handleExportPPT} className="w-full py-2 rounded bg-white/5 text-slate-300 text-xs font-bold">Download PPTX</button>
                 </div>
            </div>
        )}

        {isLaserMode && (
           <div className="fixed w-4 h-4 bg-red-500 rounded-full blur-[2px] pointer-events-none z-[100] shadow-[0_0_15px_rgba(239,68,68,0.8)] mix-blend-screen" style={{ left: laserPos.x, top: laserPos.y, transform: 'translate(-50%, -50%)' }}></div>
        )}

        {viewMode === 'GRID' && (
           <div className="w-full h-full overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4 content-start pb-24 pt-16 md:pt-4">
              {presentation.slides.map((slide, idx) => (
                 <div key={slide.id} onClick={() => { setCurrentSlideIndex(idx); setViewMode('SLIDE'); }} className={`aspect-video bg-slate-900 rounded-lg border cursor-pointer relative overflow-hidden group hover:scale-105 transition-all ${idx === currentSlideIndex ? 'border-sky-500 ring-2 ring-sky-500/50' : 'border-white/10'}`}>
                    <div className="absolute inset-0 pointer-events-none origin-top-left transform scale-[0.25] w-[400%] h-[400%]">
                       <SlideRenderer slide={slide} style={activeStyle} />
                    </div>
                    <div className="absolute bottom-1 right-1 text-[10px] font-bold text-white bg-black/50 px-1 rounded">{idx + 1}</div>
                 </div>
              ))}
           </div>
        )}

        {viewMode === 'SLIDE' && (
           <div className="flex-1 flex items-center justify-center overflow-hidden bg-black">
              <div style={{ width: BASE_WIDTH, height: BASE_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'center' }} className="relative shadow-2xl">
                 <div key={currentSlideIndex} className={`w-full h-full slide-enter-${transition}`}>
                    <SlideRenderer slide={currentSlide} style={activeStyle} />
                 </div>
              </div>
           </div>
        )}

        {viewMode === 'PRESENTER' && (
           <div className="flex-1 grid grid-cols-1 gap-4 p-4 bg-slate-950 overflow-y-auto pb-24 pt-16 md:pt-4">
              <div className="aspect-video bg-black border border-white/20 rounded-lg relative flex items-center justify-center overflow-hidden">
                 <div style={{ width: BASE_WIDTH, height: BASE_HEIGHT, transform: `scale(${scale * 0.5})`, transformOrigin: 'center' }}>
                    <SlideRenderer slide={currentSlide} style={activeStyle} />
                 </div>
              </div>
              <div className="bg-slate-900 rounded-lg border border-white/10 p-4">
                 <h3 className="text-sky-400 font-bold uppercase tracking-wider text-xs mb-2">Speaker Notes</h3>
                 <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{currentSlide.speakerNotes || "No notes."}</p>
              </div>
           </div>
        )}
      </div>

      {/* --- MOBILE BOTTOM NAV --- */}
      <div className="md:hidden h-20 bg-slate-900/95 border-t border-white/10 flex items-center justify-between px-8 shrink-0 z-50 pb-safe">
          <button onClick={prevSlide} disabled={currentSlideIndex === 0} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center disabled:opacity-30">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="text-xs font-bold text-slate-400">{currentSlideIndex + 1} / {presentation.slides.length}</div>

          <button onClick={nextSlide} disabled={currentSlideIndex === presentation.slides.length - 1} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center disabled:opacity-30">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
      </div>

    </div>
  );
};

const getPPTXColors = (style: PresentationStyle) => {
  switch (style) {
    case PresentationStyle.NeonGrid: return { bg: '0F172A', text: '22D3EE' };
    case PresentationStyle.Minimalist: return { bg: 'F8FAFC', text: '0F172A' };
    case PresentationStyle.DarkDots: return { bg: '09090B', text: 'E4E4E7' };
    case PresentationStyle.GeoPoly: return { bg: '1E1B4B', text: 'E0E7FF' };
    default: return { bg: '000000', text: 'FFFFFF' };
  }
}

export default PresentationView;
