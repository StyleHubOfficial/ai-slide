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
        gradient: 'from-cyan-950 via-slate-900 to-fuchsia-950',
        border: 'border-cyan-500/30',
        glow: 'shadow-[0_0_30px_rgba(34,211,238,0.1)]'
      };
    case PresentationStyle.Corporate:
      return {
        bg: 'bg-slate-800',
        text: 'text-white',
        accent: 'text-blue-400',
        gradient: 'from-blue-950 via-slate-900 to-slate-950',
        border: 'border-blue-500/20',
        glow: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]'
      };
    case PresentationStyle.Minimalist:
      return {
        bg: 'bg-zinc-900',
        text: 'text-zinc-200',
        accent: 'text-zinc-400',
        gradient: 'from-zinc-800 to-zinc-900',
        border: 'border-zinc-700',
        glow: ''
      };
    case PresentationStyle.Nature:
        return {
          bg: 'bg-stone-900',
          text: 'text-emerald-100',
          accent: 'text-emerald-400',
          gradient: 'from-emerald-950 via-stone-900 to-stone-950',
          border: 'border-emerald-500/20',
          glow: 'shadow-[0_0_30px_rgba(52,211,153,0.1)]'
        };
    case PresentationStyle.Futuristic:
    default:
      return {
        bg: 'bg-black',
        text: 'text-indigo-300',
        accent: 'text-violet-400',
        gradient: 'from-indigo-950 via-slate-950 to-black',
        border: 'border-indigo-500/40',
        glow: 'shadow-[0_0_30px_rgba(99,102,241,0.15)]'
      };
  }
};

export const TitleSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeClasses(style);
  return (
    <div className={`h-full w-full flex flex-col justify-center items-center text-center p-6 md:p-12 bg-gradient-to-br ${theme.gradient} relative overflow-hidden`}>
      {/* Background animated elements */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,_var(--tw-gradient-stops))] from-white/10 to-transparent animate-pulse" style={{animationDuration: '4s'}}></div>
      
      <h1 className={`text-4xl sm:text-6xl md:text-9xl font-black mb-4 md:mb-8 uppercase tracking-tighter ${theme.text} drop-shadow-[0_0_25px_rgba(0,0,0,0.5)] animate-fade-in-up`}>
        {slide.title}
      </h1>
      {slide.subtitle && (
        <div className={`text-lg sm:text-2xl md:text-4xl font-light tracking-[0.2em] md:tracking-[0.5em] uppercase ${theme.accent} border-y border-white/10 py-4 md:py-6 px-6 md:px-12 backdrop-blur-sm animate-fade-in-up stagger-2`}>
          {slide.subtitle}
        </div>
      )}
    </div>
  );
};

export const ContentSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeClasses(style);
  return (
    <div className={`h-full w-full p-6 md:p-16 bg-gradient-to-r ${theme.gradient} flex flex-col relative overflow-y-auto`}>
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none bg-[linear-gradient(45deg,transparent_25%,currentColor_25%,currentColor_50%,transparent_50%,transparent_75%,currentColor_75%,currentColor_100%)] bg-[length:20px_20px]"></div>

      <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-6 md:mb-12 uppercase tracking-tight ${theme.text} animate-fade-in-up border-b border-white/10 pb-4 md:pb-6 inline-block max-w-4xl shrink-0`}>
        {slide.title}
      </h2>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center z-10 pb-6">
        <ul className="space-y-4 md:space-y-8">
          {slide.bulletPoints?.map((point, i) => (
            <li 
              key={i} 
              className={`flex items-start text-lg sm:text-xl md:text-3xl text-slate-300 font-light leading-relaxed animate-fade-in-up`}
              style={{ animationDelay: `${(i+1) * 150}ms` }}
            >
              <span className={`mr-4 md:mr-6 mt-2 md:mt-3 w-2 h-2 md:w-3 md:h-3 shrink-0 ${theme.accent.replace('text', 'bg')} rounded-none rotate-45 shadow-[0_0_10px_currentColor]`}></span>
              {point}
            </li>
          ))}
        </ul>
        <div className={`hidden md:flex h-full min-h-[300px] md:max-h-[500px] w-full rounded-2xl border ${theme.border} bg-white/5 backdrop-blur-md items-center justify-center relative overflow-hidden group animate-fade-in-up stagger-3 ${theme.glow}`}>
             {/* Abstract Visual */}
             <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${theme.gradient}`}></div>
             <div className="text-5xl md:text-7xl opacity-20 font-black -rotate-12 scale-150 text-white mix-blend-overlay transition-transform duration-[20s] group-hover:scale-125">
                {slide.backgroundImageKeyword || "VISUAL"}
             </div>
             <div className="absolute inset-0 border-2 border-white/5 rounded-2xl"></div>
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
    <div className={`h-full w-full p-6 md:p-16 bg-gradient-to-b ${theme.gradient} flex flex-col overflow-y-auto`}>
      <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-6 md:mb-8 uppercase tracking-widest ${theme.text} text-left md:text-right border-b border-white/10 pb-4 animate-fade-in-up shrink-0`}>
        {slide.title}
      </h2>
      <div className="flex-1 flex items-end justify-center gap-4 sm:gap-8 md:gap-12 lg:gap-24 pb-6 md:pb-12 px-0 md:px-12 overflow-x-auto">
        {data?.labels.map((label, i) => {
          const val = data.datasets[0].data[i];
          const heightPerc = (val / maxVal) * 80;
          return (
            <div key={i} className="flex flex-col items-center gap-2 md:gap-4 group w-full min-w-[60px] animate-fade-in-up" style={{ animationDelay: `${i * 100 + 300}ms` }}>
              <div className="w-full bg-white/5 rounded-t-lg relative h-[250px] sm:h-[350px] md:h-[500px] flex items-end justify-center overflow-hidden backdrop-blur-sm border-x border-t border-white/5">
                 <div 
                    style={{ height: `${heightPerc}%` }} 
                    className={`w-full mx-1 md:mx-3 rounded-t-sm transition-all duration-1000 ease-out ${theme.accent.replace('text', 'bg')} opacity-80 group-hover:opacity-100 group-hover:shadow-[0_0_40px_currentColor] relative`}
                 >
                    <div className="absolute top-0 left-0 right-0 h-px bg-white/50"></div>
                 </div>
                 <span className="absolute bottom-2 md:bottom-4 text-lg md:text-4xl font-black text-white/10 group-hover:text-white/30 transition-colors z-0">
                    {val}
                 </span>
              </div>
              <span className="text-xs sm:text-sm md:text-xl text-slate-400 font-medium uppercase tracking-wider truncate w-full text-center">{label}</span>
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
    <div className={`h-full w-full p-6 md:p-16 bg-gradient-to-bl ${theme.gradient} flex flex-col`}>
       <h2 className={`text-3xl sm:text-5xl md:text-6xl font-bold mb-6 md:mb-12 uppercase ${theme.text} animate-fade-in-up shrink-0`}>
        {slide.title}
      </h2>
      <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl animate-fade-in-up stagger-2">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr>
              {slide.tableData?.headers.map((h, i) => (
                <th key={i} className={`p-4 md:p-6 text-sm md:text-2xl font-bold uppercase tracking-wider border-b border-white/10 ${theme.accent} bg-black/20`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-base md:text-xl text-slate-300">
            {slide.tableData?.rows.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/10 transition-colors group">
                {row.map((cell, j) => (
                  <td key={j} className="p-4 md:p-6 font-light group-hover:text-white transition-colors whitespace-pre-wrap">{cell}</td>
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
    <div className={`h-full w-full p-6 md:p-16 bg-gradient-to-tr ${theme.gradient} flex flex-col overflow-y-auto`}>
      <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-12 md:mb-24 text-center uppercase tracking-[0.2em] ${theme.text} animate-fade-in-up shrink-0`}>
        {slide.title}
      </h2>
      <div className="flex-1 flex flex-col md:flex-row items-center justify-between relative px-4 md:px-12 gap-8 md:gap-0">
         {/* Connecting Line (Desktop) */}
         <div className="hidden md:block absolute top-1/2 left-20 right-20 h-0.5 bg-white/20 -translate-y-1/2 z-0">
            <div className="absolute top-0 left-0 h-full bg-current w-full animate-pulse opacity-50"></div>
         </div>
         
         {/* Connecting Line (Mobile) */}
         <div className="md:hidden absolute top-20 bottom-20 left-1/2 w-0.5 bg-white/20 -translate-x-1/2 z-0"></div>

         {slide.processSteps?.map((step, i) => (
           <div key={i} className="relative z-10 flex flex-row md:flex-col items-center text-left md:text-center w-full md:max-w-[250px] group animate-fade-in-up bg-black/40 md:bg-transparent p-4 md:p-0 rounded-xl border border-white/5 md:border-none" style={{ animationDelay: `${i * 200 + 300}ms` }}>
             <div className={`w-12 h-12 md:w-24 md:h-24 shrink-0 rounded-full flex items-center justify-center text-xl md:text-3xl font-bold mb-0 md:mb-8 mr-4 md:mr-0 ${theme.bg} border-2 ${theme.border} ${theme.accent} shadow-[0_0_20px_currentColor] group-hover:scale-110 transition-transform duration-300`}>
               {i + 1}
             </div>
             <div>
               <h3 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-3">{step.title}</h3>
               <p className="text-sm md:text-base text-slate-400 leading-relaxed">{step.description}</p>
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