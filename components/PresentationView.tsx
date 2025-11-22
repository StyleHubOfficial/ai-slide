
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Presentation, PresentationStyle, TransitionStyle } from '../types';
import { SlideRenderer } from './SlideRenderers';
import { communityService } from '../services/communityService';
import Button from './ui/Button';
import Select from './ui/Select';
import XIcon from './icons/XIcon';
import PenIcon from './icons/PenIcon';
import EraserIcon from './icons/EraserIcon';
import PresenterIcon from './icons/PresenterIcon';
import ShareIcon from './icons/ShareIcon';
import PptxGenJS from 'pptxgenjs';
import Spinner from './ui/Spinner';
import CanvasDraw from './ui/CanvasDraw';

interface PresentationViewProps {
  presentation: Presentation;
  onClose: () => void;
}

// Fixed base resolution for consistent scaling (WYSWIG)
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

const PresentationView: React.FC<PresentationViewProps> = ({ presentation, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'SLIDE' | 'GRID' | 'PRESENTER'>('SLIDE');
  
  // Tools
  const [isLaserMode, setIsLaserMode] = useState(false);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  
  // Customization State
  const [activeStyle, setActiveStyle] = useState<PresentationStyle>(presentation.style);
  const [transition, setTransition] = useState<TransitionStyle>('glitch');
  const [showControls, setShowControls] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Presenter Utils
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Scaling
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Timer for presenter mode
  useEffect(() => {
    const interval = setInterval(() => setElapsedTime(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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

  // Scale Calculation Engine
  useLayoutEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || viewMode === 'GRID') return;
      const { clientWidth, clientHeight } = containerRef.current;
      // Calculate standard 16:9 fit
      const scaleX = clientWidth / BASE_WIDTH;
      const scaleY = clientHeight / BASE_HEIGHT;
      
      // Increased scale factor to 0.98 for "Bigger/Fit" view
      setScale(Math.min(scaleX, scaleY) * 0.98); 
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode, showControls]);

  // Laser Pointer Logic
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isLaserMode) {
      setLaserPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleShareToCommunity = () => {
    if (confirm("Publish this presentation to the public Community Hub?")) {
        communityService.publishDeck(presentation, 'You');
        alert("Published successfully! Check the Community tab.");
    }
  };
  
  // Simplified Exit Logic (Working Button)
  const handleExit = () => {
      // Just exit. We assume autosave handles the data safety.
      onClose();
  }

  const handleExportPPT = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      pptx.title = presentation.title;
      pptx.author = "Lakshya Presentation Studio"; // Updated Author

      const colors = getPPTXColors(activeStyle);

      presentation.slides.forEach((slide) => {
        const pptSlide = pptx.addSlide();
        pptSlide.background = { color: colors.bg };
        
        pptSlide.addText(slide.title || "Untitled Slide", { x: 0.5, y: 0.3, w: '90%', h: 1, fontSize: 36, color: colors.text, align: 'center', isTextBox: true });
        if (slide.speakerNotes) pptSlide.addNotes(slide.speakerNotes);
        
        // Basic Content Mapping
        if (slide.bulletPoints) {
            slide.bulletPoints.forEach((point, i) => {
                pptSlide.addText(point, { x: 1, y: 1.8 + (i * 0.5), w: '80%', h: 0.5, fontSize: 18, color: colors.sub, bullet: true });
            });
        }
      });

      await pptx.writeFile({ fileName: `${presentation.title.replace(/\s+/g, '_')}_Lakshya.pptx` });
    } catch (e) {
      console.error("PPT Export Error", e);
      alert("Failed to export PPTX.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') {
         if (viewMode === 'GRID' || viewMode === 'PRESENTER') setViewMode('SLIDE');
         else handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, viewMode]);

  const currentSlide = presentation.slides[currentSlideIndex];
  const nextSlideObj = presentation.slides[currentSlideIndex + 1];

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col h-full w-full overflow-hidden select-none">
      
      {/* Hidden Print Container */}
      <div className="print-only">
         {presentation.slides.map(slide => (
            <div key={slide.id} className="slide-print-wrapper">
               <div style={{ width: '1280px', height: '720px', overflow: 'hidden' }}>
                 <SlideRenderer slide={slide} style={activeStyle} />
               </div>
            </div>
         ))}
      </div>

      {/* --- TOP TOOLBAR (Desktop) --- */}
      {showControls && (
        <div className="no-print hidden md:flex h-16 bg-slate-900/90 backdrop-blur-md border-b border-white/10 items-center justify-between px-6 shrink-0 z-50">
          <div className="flex items-center gap-6">
             <button onClick={handleExit} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider group">
               <div className="p-1 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors"><XIcon className="w-4 h-4" /></div>
               Exit
             </button>
             <div className="h-6 w-px bg-white/10"></div>
             <h2 className="font-bold text-slate-200 truncate max-w-[200px] lg:max-w-md">{presentation.title}</h2>
          </div>

          <div className="flex items-center gap-3">
             {/* Modes */}
             <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                <button onClick={() => setViewMode('SLIDE')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode === 'SLIDE' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>Slide</button>
                <button onClick={() => setViewMode('GRID')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode === 'GRID' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>Grid</button>
                <button onClick={() => setViewMode('PRESENTER')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${viewMode === 'PRESENTER' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                   <PresenterIcon className="w-3 h-3" /> Presenter
                </button>
             </div>

             <div className="h-6 w-px bg-white/10"></div>

             {/* Tools */}
             <div className="flex gap-1">
                <button onClick={() => { setIsLaserMode(!isLaserMode); setIsDrawMode(false); }} className={`p-2 rounded-lg ${isLaserMode ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10 text-slate-400'}`} title="Laser"><div className="w-3 h-3 rounded-full bg-current shadow-sm"></div></button>
                <button onClick={() => { setIsDrawMode(!isDrawMode); setIsLaserMode(false); setIsEraser(false); }} className={`p-2 rounded-lg ${isDrawMode && !isEraser ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-white/10 text-slate-400'}`} title="Pen"><PenIcon className="w-4 h-4" /></button>
                <button onClick={() => { setIsDrawMode(true); setIsEraser(!isEraser); setIsLaserMode(false); }} className={`p-2 rounded-lg ${isEraser ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-white/10 text-slate-400'}`} title="Eraser"><EraserIcon className="w-4 h-4" /></button>
             </div>

             <div className="h-6 w-px bg-white/10"></div>

             {/* Styling */}
             <Select value={activeStyle} onChange={(e) => setActiveStyle(e.target.value as PresentationStyle)} className="w-28 h-9 text-xs bg-black/40 border-white/10">
                {Object.values(PresentationStyle).map(s => <option key={s} value={s}>{s}</option>)}
             </Select>

             <Select value={transition} onChange={(e) => setTransition(e.target.value as TransitionStyle)} className="w-24 h-9 text-xs bg-black/40 border-white/10">
                <option value="glitch">Glitch</option>
                <option value="fade">Fade</option>
                <option value="zoom">Zoom</option>
                <option value="cube">Cube</option>
             </Select>
             
             <button 
                onClick={handleShareToCommunity}
                className="h-9 px-3 rounded bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/50 text-pink-400 flex items-center gap-2 transition-colors"
                title="Publish to Community"
             >
                <ShareIcon className="w-4 h-4" />
             </button>

             <Button onClick={handleExportPPT} disabled={isExporting} className="h-9 px-4 text-xs bg-sky-600 border border-sky-500 flex items-center gap-2 whitespace-nowrap">
                {isExporting ? <Spinner className="w-3 h-3" /> : 'Export PPTX'}
             </Button>
          </div>
        </div>
      )}

      {/* --- MAIN VIEWPORT --- */}
      <div className="no-print flex-1 relative bg-black overflow-hidden flex flex-col" ref={containerRef} onMouseMove={handleMouseMove}>
        
        {/* Mobile Top Bar (Close Button) */}
        <div className="md:hidden absolute top-4 left-4 z-[60] flex items-center gap-2">
           <button onClick={handleExit} className="p-2 rounded-full bg-black/50 border border-white/20 text-white/80 backdrop-blur">
               <XIcon className="w-5 h-5" />
           </button>
           <button onClick={handleShareToCommunity} className="p-2 rounded-full bg-pink-500/50 border border-pink-400/20 text-white/80 backdrop-blur">
               <ShareIcon className="w-5 h-5" />
           </button>
        </div>

        {/* Laser Pointer Dot */}
        {isLaserMode && (
           <div className="fixed w-4 h-4 bg-red-500 rounded-full blur-[2px] pointer-events-none z-[100] shadow-[0_0_15px_rgba(239,68,68,0.8)] mix-blend-screen transition-transform duration-75" style={{ left: laserPos.x, top: laserPos.y, transform: 'translate(-50%, -50%)' }}></div>
        )}

        {/* VIEW: GRID */}
        {viewMode === 'GRID' && (
           <div className="w-full h-full overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-6 p-6 animate-fade-in-up content-start pb-24">
              {presentation.slides.map((slide, idx) => (
                 <div key={slide.id} onClick={() => { setCurrentSlideIndex(idx); setViewMode('SLIDE'); }} className={`aspect-video bg-slate-900 rounded-lg border cursor-pointer relative overflow-hidden group hover:scale-105 transition-all duration-200 ${idx === currentSlideIndex ? 'border-sky-500 ring-2 ring-sky-500/50' : 'border-white/10 hover:border-white/30'}`}>
                    <div className="absolute inset-0 pointer-events-none origin-top-left transform scale-[0.25] w-[400%] h-[400%]">
                       <SlideRenderer slide={slide} style={activeStyle} />
                    </div>
                    <div className="absolute bottom-2 right-2 text-xs font-bold text-white bg-black/50 px-2 rounded backdrop-blur">{idx + 1}</div>
                 </div>
              ))}
           </div>
        )}

        {/* VIEW: SLIDE (STANDARD) */}
        {viewMode === 'SLIDE' && (
           <div className="flex-1 flex items-center justify-center overflow-hidden">
              <div 
                style={{ 
                   width: BASE_WIDTH, 
                   height: BASE_HEIGHT, 
                   transform: `scale(${scale})`,
                   transformOrigin: 'center'
                }} 
                className="relative shadow-2xl border border-white/10 bg-black"
              >
                 <div key={currentSlideIndex} className={`w-full h-full slide-enter-${transition}`}>
                    <SlideRenderer slide={currentSlide} style={activeStyle} />
                 </div>
                 <CanvasDraw width={BASE_WIDTH} height={BASE_HEIGHT} enabled={isDrawMode} isEraser={isEraser} color="#38bdf8" lineWidth={isEraser ? 20 : 4} />
              </div>
           </div>
        )}

        {/* VIEW: PRESENTER MODE */}
        {viewMode === 'PRESENTER' && (
           <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-slate-950">
              {/* Main Slide (Current) */}
              <div className="lg:col-span-2 flex flex-col gap-2">
                 <div className="flex-1 bg-black border border-white/20 rounded-lg relative flex items-center justify-center overflow-hidden">
                    <div style={{ width: BASE_WIDTH, height: BASE_HEIGHT, transform: `scale(${scale * 0.9})`, transformOrigin: 'center' }}>
                       <SlideRenderer slide={currentSlide} style={activeStyle} />
                    </div>
                 </div>
                 <div className="flex justify-between text-slate-400 text-sm px-2">
                    <span>Current: Slide {currentSlideIndex + 1}</span>
                    <span>Total: {presentation.slides.length}</span>
                 </div>
              </div>
              
              {/* Sidebar Info */}
              <div className="flex flex-col gap-4">
                 {/* Next Slide Preview */}
                 <div className="aspect-video bg-black border border-white/20 rounded-lg relative overflow-hidden">
                    {nextSlideObj ? (
                       <div className="absolute inset-0 pointer-events-none origin-top-left transform scale-[0.25] w-[400%] h-[400%]">
                          <SlideRenderer slide={nextSlideObj} style={activeStyle} />
                       </div>
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-500 uppercase font-bold tracking-widest">End of Deck</div>
                    )}
                    <div className="absolute top-2 left-2 text-xs font-bold bg-sky-600 text-white px-2 py-0.5 rounded">NEXT</div>
                 </div>

                 {/* Timer & Notes */}
                 <div className="flex-1 bg-slate-900 rounded-lg border border-white/10 p-6 flex flex-col">
                    <div className="text-6xl font-mono font-bold text-white mb-6 tabular-nums">{formatTime(elapsedTime)}</div>
                    
                    <div className="flex-1 overflow-y-auto pr-2">
                       <h3 className="text-sky-400 font-bold uppercase tracking-wider text-sm mb-3">Speaker Notes</h3>
                       <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
                          {currentSlide.speakerNotes || "No notes available for this slide. Use the content on screen to guide your presentation."}
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* --- BOTTOM NAVIGATION (MOBILE APP INTERFACE) --- */}
      <div className="md:hidden h-20 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-8 shrink-0 z-50 pb-safe">
          <button onClick={prevSlide} disabled={currentSlideIndex === 0} className="flex flex-col items-center gap-1.5 text-slate-400 disabled:opacity-30 active:text-white active:scale-95 transition-transform">
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
             </div>
          </button>

          <button onClick={() => setIsDrawMode(!isDrawMode)} className={`flex flex-col items-center gap-1.5 ${isDrawMode ? 'text-sky-400' : 'text-slate-400'} active:text-white active:scale-95 transition-transform`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDrawMode ? 'bg-sky-500/20' : 'bg-white/5'}`}>
                <PenIcon className="w-5 h-5" />
             </div>
          </button>
          
          <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Slide</span>
              <span className="text-lg font-black text-white font-mono">{currentSlideIndex + 1}<span className="text-slate-600">/</span>{presentation.slides.length}</span>
          </div>

          <button onClick={() => setViewMode(viewMode === 'GRID' ? 'SLIDE' : 'GRID')} className={`flex flex-col items-center gap-1.5 ${viewMode === 'GRID' ? 'text-sky-400' : 'text-slate-400'} active:text-white active:scale-95 transition-transform`}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${viewMode === 'GRID' ? 'bg-sky-500/20' : 'bg-white/5'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
             </div>
          </button>

          <button onClick={nextSlide} disabled={currentSlideIndex === presentation.slides.length - 1} className="flex flex-col items-center gap-1.5 text-slate-400 disabled:opacity-30 active:text-white active:scale-95 transition-transform">
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
             </div>
          </button>
      </div>

    </div>
  );
};

const getPPTXColors = (style: PresentationStyle) => {
  switch (style) {
    case PresentationStyle.Cyberpunk: return { bg: '0F172A', text: '22D3EE', accent: 'D946EF', sub: 'A5F3FC' };
    case PresentationStyle.Corporate: return { bg: '1E293B', text: 'FFFFFF', accent: '60A5FA', sub: '94A3B8' };
    case PresentationStyle.Minimalist: return { bg: '18181B', text: 'E4E4E7', accent: 'A1A1AA', sub: '71717A' };
    case PresentationStyle.Nature: return { bg: '1C1917', text: 'D1FAE5', accent: '34D399', sub: '6EE7B7' };
    case PresentationStyle.Futuristic: return { bg: '000000', text: 'A5B4FC', accent: '8B5CF6', sub: 'C4B5FD' };
    default: return { bg: '000000', text: 'FFFFFF', accent: '888888', sub: 'CCCCCC' };
  }
}

export default PresentationView;