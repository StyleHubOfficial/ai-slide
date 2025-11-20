
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
        gradient: 'from-cyan-900/20 to-purple-900/20',
        border: 'border-cyan-500/30'
      };
    case PresentationStyle.Corporate:
      return {
        bg: 'bg-slate-800',
        text: 'text-white',
        accent: 'text-blue-400',
        gradient: 'from-blue-900/30 to-slate-900',
        border: 'border-blue-500/20'
      };
    case PresentationStyle.Minimalist:
      return {
        bg: 'bg-zinc-900',
        text: 'text-zinc-200',
        accent: 'text-zinc-400',
        gradient: 'from-zinc-800 to-zinc-900',
        border: 'border-zinc-700'
      };
    case PresentationStyle.Nature:
        return {
          bg: 'bg-stone-900',
          text: 'text-emerald-100',
          accent: 'text-emerald-400',
          gradient: 'from-emerald-900/20 to-stone-900',
          border: 'border-emerald-500/20'
        };
    case PresentationStyle.Futuristic:
    default:
      return {
        bg: 'bg-black',
        text: 'text-indigo-300',
        accent: 'text-violet-400',
        gradient: 'from-indigo-950 to-black',
        border: 'border-indigo-500/40'
      };
  }
};

export const TitleSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeClasses(style);
  return (
    <div className={`h-full w-full flex flex-col justify-center items-center text-center p-12 bg-gradient-to-br ${theme.gradient} relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
      <h1 className={`text-7xl md:text-8xl font-black mb-6 uppercase tracking-tighter ${theme.text} drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
        {slide.title}
      </h1>
      {slide.subtitle && (
        <div className={`text-2xl md:text-3xl font-light tracking-[0.5em] uppercase ${theme.accent} border-t border-b py-4 border-white/10`}>
          {slide.subtitle}
        </div>
      )}
    </div>
  );
};

export const ContentSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeClasses(style);
  return (
    <div className={`h-full w-full p-12 bg-gradient-to-r ${theme.gradient} flex flex-col relative`}>
      <div className="absolute top-0 right-0 w-64 h-full opacity-10 pointer-events-none bg-repeat space-y-2 p-4 overflow-hidden">
        {/* Decorative Pattern */}
        {Array.from({length: 20}).map((_, i) => (
           <div key={i} className="h-px w-full bg-current opacity-50" />
        ))}
      </div>

      <h2 className={`text-5xl font-bold mb-12 uppercase tracking-tight ${theme.text}`}>
        {slide.title}
      </h2>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10">
        <ul className="space-y-6">
          {slide.bulletPoints?.map((point, i) => (
            <li key={i} className="flex items-start text-2xl text-slate-300 font-light leading-relaxed">
              <span className={`mr-4 mt-2 w-2 h-2 ${theme.accent.replace('text', 'bg')} rounded-full shadow-[0_0_10px_currentColor]`}></span>
              {point}
            </li>
          ))}
        </ul>
        <div className={`h-full max-h-[400px] w-full rounded-xl border ${theme.border} bg-white/5 backdrop-blur-sm flex items-center justify-center relative overflow-hidden group`}>
             {/* Abstract Visual */}
             <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${theme.gradient}`}></div>
             <div className="text-6xl opacity-20 font-black rotate-12 scale-150 text-white mix-blend-overlay">
                {slide.backgroundImageKeyword || "VISUAL"}
             </div>
        </div>
      </div>
    </div>
  );
};

export const ChartSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeClasses(style);
  const data = slide.chartData;

  // Simple visualizer
  const maxVal = data?.datasets[0].data.reduce((a, b) => Math.max(a, b), 0) || 100;
  
  return (
    <div className={`h-full w-full p-12 bg-gradient-to-b ${theme.gradient} flex flex-col`}>
      <h2 className={`text-4xl font-bold mb-8 uppercase tracking-widest ${theme.text} text-right border-b border-white/10 pb-4`}>
        {slide.title}
      </h2>
      <div className="flex-1 flex items-end justify-center gap-8 md:gap-16 pb-12 px-12">
        {data?.labels.map((label, i) => {
          const val = data.datasets[0].data[i];
          const heightPerc = (val / maxVal) * 80;
          return (
            <div key={i} className="flex flex-col items-center gap-4 group w-full">
              <div className="w-full bg-slate-800/50 rounded-t-lg relative h-[400px] flex items-end justify-center">
                 <div 
                    style={{ height: `${heightPerc}%` }} 
                    className={`w-full mx-2 rounded-t transition-all duration-1000 ease-out ${theme.accent.replace('text', 'bg')} opacity-80 group-hover:opacity-100 group-hover:shadow-[0_0_20px_currentColor]`}
                 ></div>
                 <span className="absolute -top-8 text-white font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {val}
                 </span>
              </div>
              <span className="text-lg text-slate-400 font-medium uppercase tracking-wider">{label}</span>
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
    <div className={`h-full w-full p-12 bg-gradient-to-bl ${theme.gradient} flex flex-col`}>
       <h2 className={`text-5xl font-bold mb-10 uppercase ${theme.text}`}>
        {slide.title}
      </h2>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {slide.tableData?.headers.map((h, i) => (
                <th key={i} className={`p-4 text-xl font-bold uppercase tracking-wider border-b-2 ${theme.border} ${theme.accent} bg-white/5`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-lg text-slate-300">
            {slide.tableData?.rows.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="p-4 font-light">{cell}</td>
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
    <div className={`h-full w-full p-12 bg-gradient-to-tr ${theme.gradient} flex flex-col`}>
      <h2 className={`text-4xl font-bold mb-16 text-center uppercase tracking-[0.2em] ${theme.text}`}>
        {slide.title}
      </h2>
      <div className="flex-1 flex items-center justify-between relative">
         {/* Connecting Line */}
         <div className="absolute top-1/2 left-10 right-10 h-1 bg-white/10 -translate-y-1/2 z-0"></div>
         
         {slide.processSteps?.map((step, i) => (
           <div key={i} className="relative z-10 flex flex-col items-center text-center max-w-[200px]">
             <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-6 ${theme.bg} border-2 ${theme.border} ${theme.accent} shadow-[0_0_15px_currentColor]`}>
               {i + 1}
             </div>
             <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
             <p className="text-sm text-slate-400">{step.description}</p>
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
