import React, { useState, useEffect, useRef } from 'react';
import { Presentation, PresentationStyle, TransitionStyle } from '../types';
import { SlideRenderer } from './SlideRenderers';
import Button from './ui/Button';
import Select from './ui/Select';
import XIcon from './icons/XIcon';
import PptxGenJS from 'pptxgenjs';
import Spinner from './ui/Spinner';
import GlassCard from './ui/GlassCard';

interface PresentationViewProps {
  presentation: Presentation;
  onClose: () => void;
}

const PresentationView: React.FC<PresentationViewProps> = ({ presentation, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'SLIDE' | 'GRID'>('SLIDE');
  
  // Tools
  const [isLaserMode, setIsLaserMode] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  
  // Customization State
  const [activeStyle, setActiveStyle] = useState<PresentationStyle>(presentation.style);
  const [transition, setTransition] = useState<TransitionStyle>('glitch');
  const [showControls, setShowControls] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

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

  // Laser Pointer Logic
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isLaserMode) {
      setLaserPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportPPT = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      pptx.title = presentation.title;
      pptx.author = "Lumina AI - Lakshya";

      const colors = getPPTXColors(activeStyle);

      presentation.slides.forEach((slide) => {
        const pptSlide = pptx.addSlide();
        pptSlide.background = { color: colors.bg };

        // Master Background elements for Hi-Tech feel
        if (activeStyle === PresentationStyle.Cyberpunk) {
           pptSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.accent } });
        }

        // Title
        pptSlide.addText(slide.title || "Untitled Slide", {
          x: 0.5, y: 0.3, w: '90%', h: 1,
          fontSize: 36, fontFace: 'Arial Black', color: colors.text, align: 'center', isTextBox: true
        });

        // Content Mapping
        if (slide.type === 'title') {
          if (slide.subtitle) {
            pptSlide.addText(slide.subtitle, {
              x: 1, y: 2.5, w: '80%', h: 1,
              fontSize: 24, color: colors.accent, align: 'center', transparency: 10
            });
          }
        } else if (slide.type === 'content') {
           if (slide.bulletPoints) {
             const items = slide.bulletPoints.map(bp => ({ text: bp, options: { fontSize: 18, color: colors.text, breakLine: true } }));
             pptSlide.addText(items, { x: 0.5, y: 1.8, w: 5, h: 4.5, bullet: { type: 'number', color: colors.accent }, paraSpaceAfter: 16 });
           }
           // Visual Box
           pptSlide.addShape(pptx.ShapeType.rect, { x: 6, y: 1.8, w: 3.5, h: 3.5, line: { color: colors.accent, width: 2 }, fill: { color: colors.bg } });
           pptSlide.addText("VISUAL CONTENT", { x: 6, y: 3.5, w: 3.5, h: 0.5, align: 'center', color: colors.sub });

        } else if (slide.type === 'chart' && slide.chartData) {
           const dataset = slide.chartData.datasets?.[0];
           if (dataset) {
             const dataChart = [{ name: dataset.label || "Series 1", labels: slide.chartData.labels, values: dataset.data }];
             let chartType = pptx.ChartType.bar;
             if (slide.chartData.type === 'line') chartType = pptx.ChartType.line;
             if (slide.chartData.type === 'pie') chartType = pptx.ChartType.pie;
             
             pptSlide.addChart(chartType, dataChart, { 
                x: 1, y: 1.8, w: 8, h: 4.5,
                barDir: 'col', barGapWidthPct: 40,
                chartColors: [colors.accent, colors.sub],
                showValue: true, showLegend: false,
                color: colors.text
             });
           }
        } else if (slide.type === 'table' && slide.tableData) {
           const headers = slide.tableData.headers || [];
           const rows = slide.tableData.rows || [];
           if (headers.length > 0) {
              const headerRow = headers.map(h => ({ text: h, options: { fill: colors.accent, color: '000000', bold: true } }));
              const bodyRows = rows.map(row => row.map(cell => ({ text: cell, options: { color: colors.text, fill: { color: 'FFFFFF', transparency: 90 } } })));
              pptSlide.addTable([headerRow, ...bodyRows], { x: 1, y: 1.8, w: 8, color: colors.text, border: { pt: 1, color: colors.sub } });
           }
        } else if (slide.type === 'process' && slide.processSteps) {
           slide.processSteps.forEach((step, i) => {
              const xBase = 1 + (i * 2.5);
              if (xBase > 9) return;
              pptSlide.addShape(pptx.ShapeType.ellipse, { x: xBase, y: 2.5, w: 0.8, h: 0.8, fill: { color: colors.accent } });
              pptSlide.addText((i+1).toString(), { x: xBase, y: 2.5, w: 0.8, h: 0.8, align: 'center', color: '000000', bold: true });
              pptSlide.addText(step.title, { x: xBase - 0.5, y: 3.4, w: 1.8, h: 0.5, align: 'center', color: colors.text, bold: true });
           });
        }
      });

      await pptx.writeFile({ fileName: `${presentation.title.replace(/\s+/g, '_')}_Lumina_Lakshya.pptx` });
    } catch (e) {
      console.error("PPT Export Error", e);
      alert("Failed to export PPTX. Please check console.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') {
         if (viewMode === 'GRID') setViewMode('SLIDE');
         else onClose();
      }
      if (e.key === 'f') {
         if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
            setShowControls(false);
         } else {
            document.exitFullscreen();
            setIsFullscreen(false);
            setShowControls(true);
         }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, viewMode]);

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col h-screen w-screen overflow-hidden">
      
      {/* Hidden Print Container */}
      <div className="print-only">
         {presentation.slides.map(slide => (
            <div key={slide.id} className="slide-print-wrapper">
               <SlideRenderer slide={slide} style={activeStyle} />
            </div>
         ))}
      </div>

      {/* Header Toolbar */}
      {showControls && (
        <div className="no-print h-16 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-50">
          <div className="flex items-center gap-6">
             <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
               <div className="p-1 bg-white/10 rounded-full"><XIcon className="w-4 h-4" /></div>
               Exit
             </button>
             <div className="h-6 w-px bg-white/10"></div>
             <h2 className="font-bold text-slate-200 truncate max-w-[300px]">{presentation.title}</h2>
          </div>

          <div className="flex items-center gap-4">
             {/* View Switcher */}
             <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                <button onClick={() => setViewMode('SLIDE')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode === 'SLIDE' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>Slide</button>
                <button onClick={() => setViewMode('GRID')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode === 'GRID' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>Grid</button>
             </div>

             <div className="h-6 w-px bg-white/10"></div>

             {/* Laser Toggle */}
             <button 
                onClick={() => setIsLaserMode(!isLaserMode)} 
                className={`p-2 rounded-full border ${isLaserMode ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:bg-white/10'}`}
                title="Laser Pointer"
             >
                <div className="w-3 h-3 bg-current rounded-full shadow-[0_0_10px_currentColor]"></div>
             </button>

             {/* Styling */}
             <Select value={activeStyle} onChange={(e) => setActiveStyle(e.target.value as PresentationStyle)} className="w-32 h-9 text-xs bg-black/40 border-white/10">
                {Object.values(PresentationStyle).map(s => <option key={s} value={s}>{s}</option>)}
             </Select>

             <Select value={transition} onChange={(e) => setTransition(e.target.value as TransitionStyle)} className="w-28 h-9 text-xs bg-black/40 border-white/10">
                <option value="fade">Fade</option>
                <option value="zoom">Zoom</option>
                <option value="glitch">Glitch</option>
                <option value="hologram">Hologram</option>
                <option value="cube">Cube</option>
             </Select>
             
             <div className="h-6 w-px bg-white/10"></div>

             <Button onClick={handleExportPDF} className="h-9 px-4 text-xs bg-slate-800 border border-slate-600">PDF</Button>
             <Button onClick={handleExportPPT} disabled={isExporting} className="h-9 px-4 text-xs bg-sky-600 border border-sky-500 flex items-center gap-2">
                {isExporting && <Spinner className="w-3 h-3" />} PPTX
             </Button>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="no-print flex-1 overflow-hidden relative bg-black flex items-center justify-center p-4 lg:p-8" ref={containerRef} onMouseMove={handleMouseMove}>
        
        {/* Laser Pointer Dot */}
        {isLaserMode && (
           <div 
             className="fixed w-4 h-4 bg-red-500 rounded-full blur-[2px] pointer-events-none z-[100] shadow-[0_0_15px_rgba(239,68,68,0.8)] mix-blend-screen transition-transform duration-75"
             style={{ left: laserPos.x, top: laserPos.y, transform: 'translate(-50%, -50%)' }}
           ></div>
        )}

        {viewMode === 'GRID' ? (
           <div className="w-full h-full overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4 animate-fade-in-up">
              {presentation.slides.map((slide, idx) => (
                 <div 
                    key={slide.id} 
                    onClick={() => { setCurrentSlideIndex(idx); setViewMode('SLIDE'); }}
                    className={`aspect-video bg-slate-900 rounded-lg border cursor-pointer relative overflow-hidden group hover:scale-105 transition-all duration-200 ${idx === currentSlideIndex ? 'border-sky-500 ring-2 ring-sky-500/50' : 'border-white/10 hover:border-white/30'}`}
                 >
                    <div className="absolute inset-0 pointer-events-none scale-[0.25] origin-top-left w-[400%] h-[400%]">
                       <SlideRenderer slide={slide} style={activeStyle} />
                    </div>
                    <div className="absolute bottom-2 right-2 text-xs font-bold text-white bg-black/50 px-2 rounded backdrop-blur">{idx + 1}</div>
                 </div>
              ))}
           </div>
        ) : (
           <div className="w-full max-w-7xl aspect-video relative shadow-2xl bg-black">
              {/* Slide Content with Transition Key */}
              <div className="absolute inset-0 overflow-hidden border border-white/10 rounded-sm">
                 <div key={currentSlideIndex} className={`w-full h-full slide-enter-${transition}`}>
                    <SlideRenderer slide={presentation.slides[currentSlideIndex]} style={activeStyle} />
                 </div>
              </div>

              {/* Navigation Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300">
                 <button onClick={prevSlide} disabled={currentSlideIndex === 0} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                 <span className="text-xs font-mono text-slate-300">{currentSlideIndex + 1} / {presentation.slides.length}</span>
                 <button onClick={nextSlide} disabled={currentSlideIndex === presentation.slides.length - 1} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

// --- PPTX Color Helper ---
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