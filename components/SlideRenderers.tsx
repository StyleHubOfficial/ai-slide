
import React from 'react';
import { Slide, PresentationStyle } from '../types';

interface SlideProps {
  slide: Slide;
  style: PresentationStyle;
}

// Helper to get style-based classes
const getThemeClasses = (style: PresentationStyle) => {
  switch (style) {
    case PresentationStyle.Cyberpunk:
      return {
        bg: 'bg-slate-900',
        text: 'text-cyan-400',
        accent: 'text-fuchsia-500',
        sub: 'text-cyan-100',
        gradient: 'from-cyan-950 via-slate-900 to-fuchsia-950',
        border: 'border-cyan-500/30',
        glow: 'shadow-[0_0_30px_rgba(34,211,238,0.1)]',
        chartColor: 'bg-cyan-500',
        glass: 'bg-slate-950/80 border-cyan-500/20'
      };
    case PresentationStyle.Corporate:
      return {
        bg: 'bg-slate-800',
        text: 'text-white',
        accent: 'text-blue-400',
        sub: 'text-slate-100',
        gradient: 'from-blue-950 via-slate-900 to-slate-950',
        border: 'border-blue-500/20',
        glow: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]',
        chartColor: 'bg-blue-500',
        glass: 'bg-slate-900/80 border-blue-500/10'
      };
    case PresentationStyle.Minimalist:
      return {
        bg: 'bg-zinc-900',
        text: 'text-zinc-100',
        accent: 'text-zinc-400',
        sub: 'text-zinc-300',
        gradient: 'from-zinc-800 to-zinc-900',
        border: 'border-zinc-700',
        glow: '',
        chartColor: 'bg-zinc-400',
        glass: 'bg-black/70 border-zinc-700/50'
      };
    case PresentationStyle.Nature:
        return {
          bg: 'bg-stone-900',
          text: 'text-emerald-100',
          accent: 'text-emerald-400',
          sub: 'text-emerald-50',
          gradient: 'from-emerald-950 via-stone-900 to-stone-950',
          border: 'border-emerald-500/20',
          glow: 'shadow-[0_0_30px_rgba(52,211,153,0.1)]',
          chartColor: 'bg-emerald-500',
          glass: 'bg-stone-900/80 border-emerald-500/20'
        };
    case PresentationStyle.Futuristic:
    default:
      return {
        bg: 'bg-black',
        text: 'text-indigo-200',
        accent: 'text-violet-400',
        sub: 'text-indigo-100',
        gradient: 'from-indigo-950 via-slate-950 to-black',
        border: 'border-indigo-500/40',
        glow: 'shadow-[0_0_30px_rgba(99,102,241,0.15)]',
        chartColor: 'bg-indigo-500',
        glass: 'bg-slate-950/80 border-indigo-500/30'
      };
  }
};

export const getAIImageUrl = (prompt: string) => {
    // Adding keywords to ensure high quality cinematic 3d render style
    const enhancedPrompt = `${prompt}, cinematic lighting, highly detailed, 8k, unreal engine render, photorealistic, professional`;
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${Math.random()}`;
}

export const TitleSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeClasses(style);
  const bgImage = slide.imagePrompt ? getAIImageUrl(slide.imagePrompt) : null;

  return (
    <div className={`h-full w-full flex flex-col justify-center items-center text-center p-16 bg-gradient-to-br ${theme.gradient} relative overflow-hidden slide-inner-content`}>
      {bgImage && (
          <>
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-linear scale-110" style={{ backgroundImage: `url(${bgImage})` }}></div>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"></div>
          </>
      )}

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30 pointer-events-none"></div>

      <div className={`relative z-10 max-w-5xl p-12 rounded-3xl border backdrop-blur-md ${theme.glass} shadow-2xl`}>
        <h1 className={`text-7xl md:text-8xl font-black mb-6 uppercase tracking-tighter leading-none ${theme.text} drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] animate-fade-in-up`}>
          {slide.title}
        </h1>
        {slide.subtitle && (
          <div className={`text-2xl md:text-3xl font-light tracking-[0.2em] uppercase ${theme.accent} animate-fade-in-up stagger-2`}>
            {slide.subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export const ContentSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeClasses(style);
  const bgImage = slide.imagePrompt ? getAIImageUrl(slide.imagePrompt) : null;

  return (
    <div className={`h-full w-full p-12 bg-gradient-to-r ${theme.gradient} flex flex-col relative overflow-hidden slide-inner-content`}>
      {/* Background */}
      {bgImage && (
          <>
            <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${bgImage})` }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-transparent"></div>
          </>
      )}

      <h2 className={`text-5xl font-bold mb-10 uppercase tracking-tight ${theme.text} z-10 drop-shadow-md`}>
        {slide.title}
      </h2>
      
      <div className="flex-1 grid grid-cols-5 gap-12 items-center z-10">
        <div className={`col-span-3 p-8 rounded-2xl border ${theme.glass} backdrop-blur-md shadow-xl`}>
            <ul className="space-y-6">
            {slide.bulletPoints?.map((point, i) => (
                <li 
                key={i} 
                className={`flex items-start text-2xl ${theme.sub} font-medium leading-normal animate-fade-in-up`}
                style={{ animationDelay: `${i * 100}ms` }}
                >
                <span className={`mr-4 mt-2 w-2 h-2 shrink-0 rounded-full ${theme.accent.replace('text', 'bg')} shadow-[0_0_8px_currentColor]`}></span>
                <span className="drop-shadow-sm">{point}</span>
                </li>
            ))}
            </ul>
        </div>
        
        {/* Visual Sidebar */}
        <div className={`col-span-2 h-full max-h-[500px] rounded-2xl border ${theme.border} bg-black/40 backdrop-blur-sm relative overflow-hidden group ${theme.glow}`}>
             {bgImage && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}></div>}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                 <div className="text-white/60 text-sm font-mono uppercase tracking-widest border-t border-white/20 pt-2 w-full">
                     AI Visualization
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export const ChartSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeClasses(style);
  const data = slide.chartData;
  const maxVal = data?.datasets[0].data.reduce((a, b) => Math.max(a, b), 0) || 100;
  
  return (
    <div className={`h-full w-full p-12 bg-gradient-to-b ${theme.gradient} flex flex-col slide-inner-content relative`}>
      <h2 className={`text-5xl font-bold mb-8 uppercase tracking-widest ${theme.text} text-right z-10`}>
        {slide.title}
      </h2>
      <div className={`flex-1 flex items-end justify-around gap-8 pb-12 px-12 relative z-10 rounded-3xl border ${theme.glass} p-8 backdrop-blur-md`}>
        {data?.labels.map((label, i) => {
          const val = data.datasets[0].data[i];
          const heightPerc = Math.max((val / maxVal) * 80, 5); // min 5%
          return (
            <div key={i} className="flex flex-col items-center gap-4 group w-full">
              <div className="w-full relative h-[400px] flex items-end justify-center">
                 <div 
                    style={{ height: `${heightPerc}%`, animationDelay: `${i * 100 + 300}ms` }} 
                    className={`w-16 rounded-t-lg ${theme.accent.replace('text', 'bg')} opacity-90 shadow-[0_0_20px_currentColor] relative animate-grow-up hover:opacity-100 transition-all`}
                 ></div>
                 <span className="absolute bottom-[calc(100%+10px)] text-2xl font-bold text-white mb-2" style={{ bottom: `${heightPerc}%` }}>
                    {val}
                 </span>
              </div>
              <span className="text-lg text-slate-300 font-bold uppercase tracking-wider text-center border-t border-white/10 pt-4 w-full">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export const TableSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeClasses(style);
  return (
    <div className={`h-full w-full p-12 bg-gradient-to-bl ${theme.gradient} flex flex-col slide-inner-content`}>
       <h2 className={`text-5xl font-bold mb-10 uppercase ${theme.text} animate-fade-in-up`}>
        {slide.title}
      </h2>
      <div className={`flex-1 overflow-hidden rounded-2xl border ${theme.glass} shadow-2xl animate-fade-in-up stagger-2 p-2 backdrop-blur-md`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {slide.tableData?.headers.map((h, i) => (
                <th key={i} className={`p-6 text-xl font-bold uppercase tracking-wider border-b border-white/10 ${theme.accent} bg-black/40`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-xl text-slate-200">
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
    </div>
  )
}

export const ProcessSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeClasses(style);
  return (
    <div className={`h-full w-full p-12 bg-gradient-to-tr ${theme.gradient} flex flex-col slide-inner-content relative overflow-hidden`}>
      <h2 className={`text-6xl font-bold mb-20 text-center uppercase tracking-[0.2em] ${theme.text} animate-fade-in-up relative z-10`}>
        {slide.title}
      </h2>
      <div className="flex-1 flex items-center justify-center relative px-8 gap-12 z-10">
         {/* Line */}
         <div className="absolute top-[60px] left-[10%] right-[10%] h-1 bg-white/10"></div>

         {slide.processSteps?.map((step, i) => (
           <div key={i} className="relative z-10 flex flex-col items-center text-center w-full max-w-[300px] group animate-fade-in-up" style={{ animationDelay: `${i * 200 + 300}ms` }}>
             <div className={`w-28 h-28 shrink-0 rounded-full flex items-center justify-center text-4xl font-bold mb-8 ${theme.bg} border-4 ${theme.border} ${theme.accent} shadow-[0_0_30px_currentColor] group-hover:scale-110 transition-transform`}>
               {i + 1}
             </div>
             <div className={`p-6 rounded-xl border ${theme.glass} backdrop-blur-md`}>
                <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-lg text-slate-400">{step.description}</p>
             </div>
           </div>
         ))}
      </div>
    </div>
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
