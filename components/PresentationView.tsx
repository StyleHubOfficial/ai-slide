
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

// Fixed base resolution for consistent scaling (WYSWIG)
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

// Helper to download image and convert to Base64 for PPTX export
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
    } catch (e) {
        console.warn("Failed to convert image to base64 for PPTX", e);
        return null;
    }
}

const PresentationView: React.FC<PresentationViewProps> = ({ presentation, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'SLIDE' | 'GRID' | 'PRESENTER'>('SLIDE');
  
  // Tools
  const [isLaserMode, setIsLaserMode] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  // Customization State
  const [activeStyle, setActiveStyle] = useState<PresentationStyle>(presentation.style);
  const [transition, setTransition] = useState<TransitionStyle>('glitch');
  const [showControls, setShowControls] = useState(true);
  const [isExportingPPT, setIsExportingPPT] = useState(false);
  
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
      const scaleX = clientWidth / BASE_WIDTH;
      const scaleY = clientHeight / BASE_HEIGHT;
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
    try {
        if (confirm("Publish this presentation to the public Community Hub?")) {
            communityService.publishDeck(presentation, 'You');
            alert("Success! Your presentation has been published to the Community Hub.");
        }
    } catch (e) {
        console.error(e);
        alert("Sharing failed. Please try again.");
    }
  };
  
  const handleExit = () => {
      onClose();
  }

  const handleDownloadPDF = () => {
      setShowDownloadMenu(false);
      alert("A print dialog will open. Please choose 'Save as PDF' in the destination settings.");
      // Wait for menu to close then print
      setTimeout(() => window.print(), 500);
  };

  const handleExportPPT = async () => {
    if (isExportingPPT) return;
    setIsExportingPPT(true);
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      pptx.title = presentation.title;
      pptx.author = "Lakshya Presentation Studio";

      const colors = getPPTXColors(activeStyle);

      for (const slide of presentation.slides) {
        const pptSlide = pptx.addSlide();
        pptSlide.background = { color: colors.bg };

        // Add Background Image if available
        if (slide.imagePrompt) {
            const imageUrl = getAIImageUrl(slide.imagePrompt);
            const base64Img = await imageToBase64(imageUrl);
            
            if (base64Img) {
               // Use Base64 to ensure it works offline/in-app
               pptSlide.addImage({ data: base64Img, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover', w: '100%', h: '100%' } });
               // Darken overlay
               pptSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '000000', transparency: 60 } });
            }
        }
        
        // Title
        pptSlide.addText(slide.title || "Untitled Slide", { x: 0.5, y: 0.5, w: '90%', h: 1.5, fontSize: 36, color: colors.text, align: 'center', bold: true });
        
        if (slide.speakerNotes) pptSlide.addNotes(slide.speakerNotes);
        
        // Content Logic
        if (slide.type === 'content' && slide.bulletPoints) {
            slide.bulletPoints.forEach((point, i) => {
                pptSlide.addText(point, { x: 1, y: 2 + (i * 0.7), w: '80%', h: 0.6, fontSize: 20, color: colors.sub, bullet: true });
            });
        }
        else if (slide.type === 'title' && slide.subtitle) {
             pptSlide.addText(slide.subtitle, { x: 1, y: 2, w: '80%', h: 1, fontSize: 24, color: colors.accent, align: 'center' });
        }
        else if (slide.type === 'chart' && slide.chartData) {
             const chartStr = slide.chartData.labels.map((l, i) => `${l}: ${slide.chartData?.datasets[0].data[i]}`).join('\n');
             pptSlide.addText("Chart Data:", { x: 1, y: 2, fontSize: 18, color: colors.text, bold: true });
             pptSlide.addText(chartStr, { x: 1, y: 2.5, w: '80%', h: 4, fontSize: 16, color: colors.sub });
        }
      }

      await pptx.writeFile({ fileName: `${presentation.title.replace(/\s+/g, '_')}_Lakshya.pptx` });
    } catch (e) {
      console.error("PPT Export Error", e);
      alert("Failed to export PPTX. Images could not be loaded. Please check your connection.");
    } finally {
      setIsExportingPPT(false);
      setShowDownloadMenu(false);
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
      
      {/* Hidden Print Container for PDF */}
      <div className="print-only">
         {presentation.slides.map(slide => (
            <div key={slide.id} className="slide-print-wrapper">
               <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
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
                <button onClick={() => setIsLaserMode(!isLaserMode)} className={`p-2 rounded-lg ${isLaserMode ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10 text-slate-400'}`} title="Laser"><div className="w-3 h-3 rounded-full bg-current shadow-sm"></div></button>
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

             {/* Desktop Download Button */}
             <div className="relative">
                <Button onClick={() => setShowDownloadMenu(!showDownloadMenu)} className="h-9 px-4 text-xs bg-sky-600 border border-sky-500 flex items-center gap-2 whitespace-nowrap">
                    Download
                    <svg className={`w-3 h-3 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </Button>
                
                {showDownloadMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up z-50">
                        <button onClick={handleDownloadPDF} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 text-slate-300 hover:text-white">
                            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            Export as PDF
                        </button>
                        <button onClick={handleExportPPT} disabled={isExportingPPT} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 text-slate-300 hover:text-white disabled:opacity-50">
                            {isExportingPPT ? <Spinner className="w-5 h-5" /> : <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                            Export as PPTX
                        </button>
                    </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* --- MAIN VIEWPORT --- */}
      <div className="no-print flex-1 relative bg-black overflow-hidden flex flex-col" ref={containerRef} onMouseMove={handleMouseMove}>
        
        {/* Mobile Top Bar */}
        <div className="md:hidden absolute top-4 left-4 right-4 z-[60] flex items-center justify-between">
           <div className="flex gap-3">
               <button onClick={handleExit} className="p-2 rounded-full bg-black/50 border border-white/20 text-white/80 backdrop-blur">
                   <XIcon className="w-5 h-5" />
               </button>
               <button onClick={handleShareToCommunity} className="p-2 rounded-full bg-pink-500/50 border border-pink-400/20 text-white/80 backdrop-blur">
                   <ShareIcon className="w-5 h-5" />
               </button>
           </div>
           
           <div className="bg-black/50 backdrop-blur rounded-full px-2 py-1 border border-white/20">
              <select 
                 value={activeStyle} 
                 onChange={(e) => setActiveStyle(e.target.value as PresentationStyle)} 
                 className="bg-transparent text-white text-xs font-bold border-none outline-none appearance-none pr-4 relative z-10"
              >
                  {Object.values(PresentationStyle).map(s => <option key={s} value={s} className="text-black">{s}</option>)}
              </select>
           </div>
        </div>

        {isLaserMode && (
           <div className="fixed w-4 h-4 bg-red-500 rounded-full blur-[2px] pointer-events-none z-[100] shadow-[0_0_15px_rgba(239,68,68,0.8)] mix-blend-screen" style={{ left: laserPos.x, top: laserPos.y, transform: 'translate(-50%, -50%)' }}></div>
        )}

        {viewMode === 'GRID' && (
           <div className="w-full h-full overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4 md:p-6 animate-fade-in-up content-start pb-24">
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
              </div>
           </div>
        )}

        {viewMode === 'PRESENTER' && (
           <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-slate-950 overflow-y-auto pb-24">
              <div className="lg:col-span-2 flex flex-col gap-2">
                 <div className="flex-1 aspect-video bg-black border border-white/20 rounded-lg relative flex items-center justify-center overflow-hidden">
                    <div style={{ width: BASE_WIDTH, height: BASE_HEIGHT, transform: `scale(${scale * (window.innerWidth < 768 ? 0.4 : 0.9)})`, transformOrigin: 'center' }}>
                       <SlideRenderer slide={currentSlide} style={activeStyle} />
                    </div>
                 </div>
                 <div className="flex justify-between text-slate-400 text-sm px-2">
                    <span>Current: Slide {currentSlideIndex + 1}</span>
                    <span>Total: {presentation.slides.length}</span>
                 </div>
              </div>
              
              <div className="flex flex-col gap-4">
                 <div className="aspect-video bg-black border border-white/20 rounded-lg relative overflow-hidden hidden md:block">
                    {nextSlideObj ? (
                       <div className="absolute inset-0 pointer-events-none origin-top-left transform scale-[0.25] w-[400%] h-[400%]">
                          <SlideRenderer slide={nextSlideObj} style={activeStyle} />
                       </div>
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-500 uppercase font-bold tracking-widest">End of Deck</div>
                    )}
                    <div className="absolute top-2 left-2 text-xs font-bold bg-sky-600 text-white px-2 py-0.5 rounded">NEXT</div>
                 </div>

                 <div className="flex-1 bg-slate-900 rounded-lg border border-white/10 p-4 md:p-6 flex flex-col">
                    <div className="text-4xl md:text-6xl font-mono font-bold text-white mb-4 md:mb-6 tabular-nums">{formatTime(elapsedTime)}</div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 max-h-40 md:max-h-full">
                       <h3 className="text-sky-400 font-bold uppercase tracking-wider text-sm mb-3">Speaker Notes</h3>
                       <p className="text-slate-300 text-sm md:text-lg leading-relaxed whitespace-pre-wrap">
                          {currentSlide.speakerNotes || "No notes available for this slide."}
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* --- BOTTOM NAVIGATION (MOBILE) --- */}
      <div className="md:hidden h-20 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-6 shrink-0 z-50 pb-safe">
          <button onClick={prevSlide} disabled={currentSlideIndex === 0} className="flex flex-col items-center gap-1.5 text-slate-400 disabled:opacity-30 active:text-white active:scale-95 transition-transform">
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
             </div>
          </button>

          <div className="relative">
              <button 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)} 
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-transform active:scale-95 ${showDownloadMenu ? 'bg-white text-sky-600' : 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white'}`}
              >
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>

              {showDownloadMenu && (
                 <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 bg-slate-800 border border-white/20 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up z-[100] mb-2">
                     <button onClick={handleDownloadPDF} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 text-slate-300 hover:text-white border-b border-white/10">
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        Download PDF
                     </button>
                     <button onClick={handleExportPPT} disabled={isExportingPPT} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 text-slate-300 hover:text-white disabled:opacity-50">
                        {isExportingPPT ? <Spinner className="w-5 h-5" /> : <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                        Download PPTX
                     </button>
                 </div>
              )}
          </div>

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
