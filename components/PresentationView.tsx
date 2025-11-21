
import React, { useState, useEffect } from 'react';
import { Presentation, PresentationStyle, TransitionStyle } from '../types';
import { SlideRenderer } from './SlideRenderers';
import Button from './ui/Button';
import Select from './ui/Select';
import XIcon from './icons/XIcon';
import PptxGenJS from 'pptxgenjs';
import Spinner from './ui/Spinner';

interface PresentationViewProps {
  presentation: Presentation;
  onClose: () => void;
}

const PresentationView: React.FC<PresentationViewProps> = ({ presentation, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Customization State
  const [activeStyle, setActiveStyle] = useState<PresentationStyle>(presentation.style);
  const [transition, setTransition] = useState<TransitionStyle>('zoom');
  const [showControls, setShowControls] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExportPDF = () => {
    // Using window.print() which leverages the @media print styles in index.html
    window.print();
  };

  const handleExportPPT = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const pptx = new PptxGenJS();
      
      // Configure Layout
      pptx.layout = 'LAYOUT_16x9';
      pptx.title = presentation.title;
      pptx.author = presentation.author || "Lumina AI";

      // Get colors based on style
      const colors = getPPTXColors(activeStyle);

      // Generate Slides
      presentation.slides.forEach((slide) => {
        const pptSlide = pptx.addSlide();
        
        // Background
        pptSlide.background = { color: colors.bg };

        // Title
        pptSlide.addText(slide.title || "Untitled Slide", {
          x: 0.5, y: 0.5, w: '90%', h: 1,
          fontSize: 32,
          fontFace: 'Arial Black',
          color: colors.text,
          align: 'center',
          isTextBox: true
        });

        // Slide Type Logic
        if (slide.type === 'title') {
          // Subtitle
          if (slide.subtitle) {
            pptSlide.addText(slide.subtitle, {
              x: 1, y: 3, w: '80%', h: 1,
              fontSize: 18,
              color: colors.accent,
              align: 'center',
              transparency: 20
            });
          }
          // Decorative element
          pptSlide.addShape(pptx.ShapeType.rect, {
             x: 0, y: 0, w: '100%', h: 0.2,
             fill: { color: colors.accent, transparency: 80 }
          });

        } else if (slide.type === 'content') {
           // Content Bullet Points
           if (slide.bulletPoints && slide.bulletPoints.length > 0) {
             const items = slide.bulletPoints.map(bp => ({ text: bp, options: { fontSize: 18, color: colors.text, breakLine: true } }));
             pptSlide.addText(items, {
               x: 0.5, y: 2, w: 5, h: 4,
               bullet: { type: 'number', color: colors.accent },
               paraSpaceAfter: 12
             });
           }

           // visual placeholder (Right side)
           pptSlide.addShape(pptx.ShapeType.rect, {
              x: 6, y: 2, w: 3.5, h: 3.5,
              fill: { color: 'FFFFFF', transparency: 90 },
              line: { color: colors.accent, width: 1 }
           });
           pptSlide.addText("VISUAL", {
              x: 6, y: 3.5, w: 3.5, h: 0.5,
              align: 'center', color: colors.accent, fontSize: 14
           });

        } else if (slide.type === 'chart' && slide.chartData) {
           // Chart
           const dataset = slide.chartData.datasets?.[0];
           if (dataset) {
             const dataChart = [
                {
                   name: dataset.label || "Data",
                   labels: slide.chartData.labels || [],
                   values: dataset.data || []
                }
             ];
             
             // Map internal chart types to PptxGenJS types
             let chartType = pptx.ChartType.bar;
             if (slide.chartData.type === 'line') chartType = pptx.ChartType.line;
             if (slide.chartData.type === 'pie') chartType = pptx.ChartType.pie;

             pptSlide.addChart(chartType, dataChart, { 
                x: 1, y: 2, w: 8, h: 4.5,
                barDir: 'col',
                barGapWidthPct: 50,
                chartColors: [colors.accent],
                chartColorsOpacity: 80,
                showValue: true
             });
           }

        } else if (slide.type === 'table' && slide.tableData) {
           // Table
           const headers = slide.tableData.headers || [];
           const rows = slide.tableData.rows || [];
           
           if (headers.length > 0 && rows.length > 0) {
              const headerRow = headers.map(h => ({ text: h, options: { fill: colors.accent, color: colors.bg, fontFace: 'Arial', bold: true } }));
              const bodyRows = rows.map(row => row.map(cell => ({ text: cell || "", options: { color: colors.text, fill: { color: colors.bg, transparency: 50 } } })));
              
              pptSlide.addTable([headerRow, ...bodyRows], {
                 x: 1, y: 2, w: 8,
                 border: { pt: 1, color: colors.accent },
                 fontSize: 14
              });
           }

        } else if (slide.type === 'process' && slide.processSteps) {
           // Process Steps
           slide.processSteps.forEach((step, i) => {
              const xPos = 1 + (i * 2.5);
              if (xPos > 9) return; // prevent overflow
              
              // Circle
              pptSlide.addShape(pptx.ShapeType.ellipse, {
                 x: xPos, y: 2.5, w: 0.8, h: 0.8,
                 fill: { color: colors.accent },
                 align: 'center'
              });
              // Number
              pptSlide.addText((i + 1).toString(), {
                 x: xPos, y: 2.5, w: 0.8, h: 0.8,
                 align: 'center', color: colors.bg, bold: true
              });
              // Title & Desc
              pptSlide.addText(step.title, {
                 x: xPos - 0.5, y: 3.4, w: 1.8, h: 0.5,
                 align: 'center', color: colors.text, bold: true, fontSize: 14
              });
              pptSlide.addText(step.description, {
                 x: xPos - 0.5, y: 3.9, w: 1.8, h: 1,
                 align: 'center', color: '94A3B8', fontSize: 10
              });
           });
        }
      });

      // Save
      await pptx.writeFile({ fileName: `${presentation.title.replace(/[^a-z0-9]/gi, '_')}_Lumina.pptx` });
    } catch (e) {
      console.error("PPT Generation Error", e);
      alert("Failed to generate PowerPoint file. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onClose();
      if (e.key === 'f') {
         setIsFullscreen(prev => !prev);
         setShowControls(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex]);

  return (
    <div className={`fixed inset-0 z-50 bg-black text-white flex flex-col h-screen w-screen ${isFullscreen ? 'p-0' : ''}`}>
      
      {/* HIDDEN PRINT CONTAINER (Only visible in Print/PDF mode) */}
      <div className="print-only">
         {presentation.slides.map(slide => (
            <div key={slide.id} className="slide-print-wrapper relative overflow-hidden">
               <SlideRenderer slide={slide} style={activeStyle} />
            </div>
         ))}
      </div>

      {/* Edit / Control Toolbar (Hidden when printing) */}
      {showControls && (
        <div className="no-print min-h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 flex flex-col md:flex-row items-center justify-between px-4 py-2 md:py-0 shrink-0 z-50 shadow-xl gap-4 md:gap-0 overflow-x-auto">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
             <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-full transition-colors group shrink-0">
               <XIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
             </button>
             
             <div className="flex flex-col">
                <h2 className="font-bold text-slate-200 text-xs md:text-sm truncate max-w-[150px] md:max-w-[200px]">{presentation.title}</h2>
                <span className="text-[10px] md:text-xs text-slate-500 font-mono">{currentSlideIndex + 1} / {presentation.slides.length}</span>
             </div>

             <div className="h-8 w-px bg-slate-800 mx-2 hidden md:block"></div>

             {/* Customization Controls (Responsive Stack) */}
             <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden sm:flex flex-col">
                   <label className="text-[8px] md:text-[10px] uppercase font-bold text-slate-500 mb-1">Transition</label>
                   <Select 
                      value={transition} 
                      onChange={(e) => setTransition(e.target.value as TransitionStyle)}
                      className="w-24 md:w-32 py-1 text-xs bg-slate-900 border-slate-700 h-8"
                   >
                      <option value="fade">Soft Fade</option>
                      <option value="zoom">Zoom</option>
                      <option value="hologram">Hologram</option>
                      <option value="shutter">Shutter</option>
                   </Select>
                </div>

                <div className="flex flex-col">
                   <label className="hidden sm:block text-[8px] md:text-[10px] uppercase font-bold text-slate-500 mb-1">Theme</label>
                   <Select 
                      value={activeStyle} 
                      onChange={(e) => setActiveStyle(e.target.value as PresentationStyle)}
                      className="w-28 md:w-32 py-1 text-xs bg-slate-900 border-slate-700 h-8"
                   >
                      {Object.values(PresentationStyle).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                   </Select>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
             <Button 
                className="py-1.5 px-3 text-[10px] md:text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 whitespace-nowrap"
                onClick={() => setShowControls(false)}
             >
               Present (F)
             </Button>
             <Button 
                onClick={handleExportPDF}
                className="py-1.5 px-3 text-[10px] md:text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 whitespace-nowrap"
             >
               Print / Save PDF
             </Button>
             <Button 
                onClick={handleExportPPT}
                disabled={isExporting}
                className="py-1.5 px-3 text-[10px] md:text-xs bg-sky-600 hover:bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.4)] whitespace-nowrap flex items-center gap-2"
             >
               {isExporting && <Spinner className="w-3 h-3" />}
               {isExporting ? 'Generating...' : 'Export .PPTX'}
             </Button>
          </div>
        </div>
      )}

      {/* Main Stage (Hidden when printing) */}
      <div className="no-print flex-1 flex overflow-hidden relative bg-black">
        
        {/* Sidebar Thumbnails (Hidden in fullscreen and small screens) */}
        {showControls && (
          <div className="w-48 bg-slate-950 border-r border-slate-800 overflow-y-auto hidden lg:block p-3 space-y-3 shrink-0 z-10">
             {presentation.slides.map((slide, idx) => (
               <div 
                  key={slide.id} 
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-full aspect-video bg-slate-900 rounded border transition-all transform hover:scale-105 cursor-pointer relative overflow-hidden group ${idx === currentSlideIndex ? 'border-sky-500 ring-1 ring-sky-500 shadow-lg' : 'border-slate-800 opacity-60 hover:opacity-100'}`}
               >
                  <div className="absolute inset-0 flex items-center justify-center text-[8px] text-slate-600 uppercase font-bold pointer-events-none">
                    {slide.type}
                  </div>
                  {/* Mini Indicator */}
                  {idx === currentSlideIndex && <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500"></div>}
               </div>
             ))}
          </div>
        )}

        {/* Slide Container */}
        <div className="flex-1 relative flex items-center justify-center p-0 md:p-4 bg-grid-slate-900/[0.04]">
          
          {/* The Slide Wrapper with Key-based Animation */}
          <div 
            className="w-full h-full md:aspect-video shadow-2xl overflow-hidden relative border-y md:border border-slate-800/50 bg-black"
            style={{ maxHeight: '100%' }}
          >
             <div 
               key={currentSlideIndex} 
               className={`w-full h-full slide-enter-${transition}`}
             >
                <SlideRenderer slide={presentation.slides[currentSlideIndex]} style={activeStyle} />
             </div>
          </div>

          {/* Navigation Zones (Invisible buttons for clean UI) */}
          {!showControls && (
             <>
               <div className="absolute top-4 right-4 z-50 opacity-0 hover:opacity-100 transition-opacity">
                  <Button onClick={() => setShowControls(true)} className="text-xs py-1 px-2 bg-white/10 backdrop-blur">Exit Mode</Button>
               </div>
             </>
          )}
          
          {/* Navigation Floating Buttons */}
          <button 
            onClick={prevSlide}
            disabled={currentSlideIndex === 0}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-2 md:p-4 rounded-full hover:bg-white/5 text-slate-500 hover:text-white disabled:opacity-0 transition-all z-20 focus:outline-none"
          >
            <svg className="w-8 h-8 md:w-10 md:h-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <button 
            onClick={nextSlide}
            disabled={currentSlideIndex === presentation.slides.length - 1}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-2 md:p-4 rounded-full hover:bg-white/5 text-slate-500 hover:text-white disabled:opacity-0 transition-all z-20 focus:outline-none"
          >
            <svg className="w-8 h-8 md:w-10 md:h-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
          </button>

        </div>
      </div>
    </div>
  );
};

// Helper for PPT Colors (Hex without #)
const getPPTXColors = (style: PresentationStyle) => {
  switch (style) {
    case PresentationStyle.Cyberpunk: return { bg: '0F172A', text: '22D3EE', accent: 'D946EF' };
    case PresentationStyle.Corporate: return { bg: '1E293B', text: 'FFFFFF', accent: '60A5FA' };
    case PresentationStyle.Minimalist: return { bg: '18181B', text: 'E4E4E7', accent: 'A1A1AA' };
    case PresentationStyle.Nature: return { bg: '1C1917', text: 'D1FAE5', accent: '34D399' };
    case PresentationStyle.Futuristic: return { bg: '000000', text: 'A5B4FC', accent: '8B5CF6' };
    default: return { bg: '000000', text: 'FFFFFF', accent: '888888' };
  }
}

export default PresentationView;
