
import React from 'react';
import { Slide, PresentationStyle } from '../types';

interface SlideProps {
  slide: Slide;
  style: PresentationStyle;
}

// Helper to get sophisticated theme visuals
const getThemeVisuals = (style: PresentationStyle) => {
  switch (style) {
    case PresentationStyle.NeonGrid:
      return {
        // Cyberpunk Grid Pattern
        containerClass: 'bg-slate-950 text-cyan-400',
        bgStyle: {
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.15) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 1) 90%)
          `,
          backgroundSize: '40px 40px, 40px 40px, 100% 100%'
        },
        text: 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]',
        accent: 'text-fuchsia-500',
        sub: 'text-cyan-100',
        border: 'border-cyan-500/30',
        glass: 'bg-slate-900/80 border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]',
        chartColor: 'bg-cyan-500',
        processCircle: 'bg-slate-900 border-cyan-500 text-cyan-400'
      };
    case PresentationStyle.DarkDots:
      return {
        // Minimalist Dot Matrix
        containerClass: 'bg-zinc-950 text-zinc-100',
        bgStyle: {
          backgroundImage: 'radial-gradient(rgba(113, 113, 122, 0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        },
        text: 'text-zinc-100 font-bold tracking-tight',
        accent: 'text-white',
        sub: 'text-zinc-400',
        border: 'border-zinc-700',
        glass: 'bg-black/60 border-zinc-800 backdrop-blur-md shadow-xl',
        chartColor: 'bg-zinc-100',
        processCircle: 'bg-zinc-900 border-zinc-500 text-zinc-200'
      };
    case PresentationStyle.GeoPoly:
      return {
        // Abstract Geometric Shapes
        containerClass: 'bg-indigo-950 text-indigo-100',
        bgStyle: {
          backgroundImage: `
            repeating-linear-gradient(45deg, rgba(99, 102, 241, 0.05) 0px, rgba(99, 102, 241, 0.05) 2px, transparent 2px, transparent 20px),
            repeating-linear-gradient(-45deg, rgba(168, 85, 247, 0.05) 0px, rgba(168, 85, 247, 0.05) 2px, transparent 2px, transparent 20px)
          `,
          backgroundSize: '100% 100%'
        },
        text: 'text-indigo-200 font-serif',
        accent: 'text-violet-400',
        sub: 'text-indigo-100/80',
        border: 'border-indigo-500/30',
        glass: 'bg-slate-900/40 border-indigo-400/30 backdrop-blur-lg',
        chartColor: 'bg-indigo-500',
        processCircle: 'bg-indigo-900 border-indigo-400 text-indigo-300'
      };
    case PresentationStyle.Minimalist:
      return {
        // Clean White Paper Style
        containerClass: 'bg-slate-50 text-slate-900',
        bgStyle: {
             backgroundColor: '#f8fafc',
             backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
             backgroundSize: '50px 50px'
        },
        text: 'text-slate-900 font-bold',
        accent: 'text-sky-600',
        sub: 'text-slate-600',
        border: 'border-slate-200',
        glass: 'bg-white/80 border-slate-200 shadow-lg backdrop-blur-sm',
        chartColor: 'bg-sky-600',
        processCircle: 'bg-white border-slate-300 text-slate-700'
      };
    case PresentationStyle.SoftGradient:
    default:
      return {
        // Modern Liquid Gradient
        containerClass: 'bg-slate-900 text-white',
        bgStyle: {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)'
        },
        text: 'text-white font-sans',
        accent: 'text-pink-400',
        sub: 'text-slate-200',
        border: 'border-white/10',
        glass: 'bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl',
        chartColor: 'bg-pink-500',
        processCircle: 'bg-white/10 border-pink-400 text-white'
      };
  }
};

export const getAIImageUrl = (prompt: string) => {
    // Enhanced prompts for better generation
    const enhancedPrompt = `${prompt}, cinematic lighting, highly detailed, 8k, unreal engine render, photorealistic, professional, minimalist background`;
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${Math.random()}`;
}

const SlideContainer: React.FC<{ children: React.ReactNode, theme: any, slide: Slide }> = ({ children, theme, slide }) => {
    const bgImage = slide.imagePrompt ? getAIImageUrl(slide.imagePrompt) : null;
    return (
        <div 
            className={`h-full w-full relative overflow-hidden flex flex-col p-12 slide-inner-content ${theme.containerClass}`}
            style={theme.bgStyle}
        >
            {/* Optional AI Background Layer with Blend Mode */}
            {bgImage && (
                <>
                    <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-[60s] ease-linear scale-110 opacity-30 mix-blend-overlay" 
                        style={{ backgroundImage: `url(${bgImage})` }}
                    ></div>
                    {/* Gradient Fade for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                </>
            )}
            
            {/* Content Layer */}
            <div className="relative z-10 h-full flex flex-col">
                {children}
            </div>
        </div>
    )
}

export const TitleSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeVisuals(style);
  return (
    <SlideContainer theme={theme} slide={slide}>
      <div className="h-full flex flex-col justify-center items-center text-center">
          <div className={`p-12 rounded-3xl border ${theme.glass}`}>
            <h1 className={`text-6xl md:text-8xl mb-6 uppercase tracking-tighter leading-none ${theme.text} animate-fade-in-up`}>
            {slide.title}
            </h1>
            {slide.subtitle && (
            <div className={`text-2xl md:text-3xl font-light tracking-[0.2em] uppercase ${theme.accent} animate-fade-in-up stagger-2`}>
                {slide.subtitle}
            </div>
            )}
          </div>
      </div>
    </SlideContainer>
  );
};

export const ContentSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeVisuals(style);
  return (
    <SlideContainer theme={theme} slide={slide}>
      <h2 className={`text-5xl font-bold mb-10 uppercase tracking-tight ${theme.text} drop-shadow-md`}>
        {slide.title}
      </h2>
      
      <div className="flex-1 grid grid-cols-12 gap-12 items-center">
        <div className={`col-span-7 p-8 rounded-2xl border ${theme.glass} h-full`}>
            <ul className="space-y-6">
            {slide.bulletPoints?.map((point, i) => (
                <li 
                key={i} 
                className={`flex items-start text-2xl ${theme.sub} font-medium leading-normal animate-fade-in-up`}
                style={{ animationDelay: `${i * 100}ms` }}
                >
                <span className={`mr-4 mt-2 w-2 h-2 shrink-0 rounded-full ${theme.accent.replace('text', 'bg')} shadow-[0_0_8px_currentColor]`}></span>
                <span>{point}</span>
                </li>
            ))}
            </ul>
        </div>
        
        {/* Visual Sidebar */}
        <div className={`col-span-5 h-full rounded-2xl border ${theme.border} bg-black/20 backdrop-blur-sm relative overflow-hidden group shadow-lg`}>
             {slide.imagePrompt && (
                <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: `url(${getAIImageUrl(slide.imagePrompt)})` }}
                ></div>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                 <div className="text-white/60 text-xs font-mono uppercase tracking-widest border-t border-white/20 pt-2 w-full">
                     Figure 1.1: Visualization
                 </div>
             </div>
        </div>
      </div>
    </SlideContainer>
  );
};

export const ChartSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeVisuals(style);
  const data = slide.chartData;
  const maxVal = data?.datasets[0].data.reduce((a, b) => Math.max(a, b), 0) || 100;
  
  return (
    <SlideContainer theme={theme} slide={slide}>
      <h2 className={`text-5xl font-bold mb-8 uppercase tracking-widest ${theme.text} text-right`}>
        {slide.title}
      </h2>
      <div className={`flex-1 flex items-end justify-around gap-8 pb-12 px-12 rounded-3xl border ${theme.glass} p-8`}>
        {data?.labels.map((label, i) => {
          const val = data.datasets[0].data[i];
          const heightPerc = Math.max((val / maxVal) * 80, 5); 
          return (
            <div key={i} className="flex flex-col items-center gap-4 group w-full h-full justify-end">
              <div className="w-full relative h-full flex items-end justify-center">
                 <div 
                    style={{ height: `${heightPerc}%`, animationDelay: `${i * 100 + 300}ms` }} 
                    className={`w-16 rounded-t-sm ${theme.chartColor} opacity-90 shadow-[0_0_20px_currentColor] relative animate-grow-up hover:opacity-100 transition-all`}
                 ></div>
                 <span className={`absolute bottom-[calc(${heightPerc}%+10px)] text-2xl font-bold ${theme.accent}`}>
                    {val}
                 </span>
              </div>
              <span className={`text-lg ${theme.sub} font-bold uppercase tracking-wider text-center border-t border-white/10 pt-4 w-full`}>{label}</span>
            </div>
          )
        })}
      </div>
    </SlideContainer>
  );
};

export const TableSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeVisuals(style);
  return (
    <SlideContainer theme={theme} slide={slide}>
       <h2 className={`text-5xl font-bold mb-10 uppercase ${theme.text} animate-fade-in-up`}>
        {slide.title}
      </h2>
      <div className={`flex-1 overflow-hidden rounded-2xl border ${theme.glass} shadow-2xl animate-fade-in-up stagger-2 p-2`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {slide.tableData?.headers.map((h, i) => (
                <th key={i} className={`p-6 text-xl font-bold uppercase tracking-wider border-b border-white/10 ${theme.accent} bg-black/10`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`text-xl ${theme.sub}`}>
            {slide.tableData?.rows.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="p-6 font-light">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SlideContainer>
  )
}

export const ProcessSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeVisuals(style);
  return (
    <SlideContainer theme={theme} slide={slide}>
      <h2 className={`text-6xl font-bold mb-20 text-center uppercase tracking-[0.2em] ${theme.text} animate-fade-in-up`}>
        {slide.title}
      </h2>
      <div className="flex-1 flex items-center justify-center relative px-8 gap-12">
         {/* Connector Line */}
         <div className="absolute top-[60px] left-[10%] right-[10%] h-1 bg-current opacity-20"></div>

         {slide.processSteps?.map((step, i) => (
           <div key={i} className="relative z-10 flex flex-col items-center text-center w-full max-w-[300px] group animate-fade-in-up" style={{ animationDelay: `${i * 200 + 300}ms` }}>
             <div className={`w-28 h-28 shrink-0 rounded-full flex items-center justify-center text-4xl font-bold mb-8 border-4 shadow-lg ${theme.processCircle} group-hover:scale-110 transition-transform bg-black`}>
               {i + 1}
             </div>
             <div className={`p-6 rounded-xl border ${theme.glass}`}>
                <h3 className={`text-2xl font-bold mb-2 ${theme.text}`}>{step.title}</h3>
                <p className={`text-lg ${theme.sub}`}>{step.description}</p>
             </div>
           </div>
         ))}
      </div>
    </SlideContainer>
  )
}

export const SlideRenderer: React.FC<SlideProps> = (props) => {
  switch (props.slide.type) {
    case 'title': return <TitleSlide {...props} />;
    case 'content': return <ContentSlide {...props} />;
    case 'chart': return <ChartSlide {...props} />;
    case 'table': return <TableSlide {...props} />;
    case 'process': return <ProcessSlide {...props} />;
    default: return <ContentSlide {...props} />;
  }
}
