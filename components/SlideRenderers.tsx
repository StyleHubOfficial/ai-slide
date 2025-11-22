
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
        sub: 'text-cyan-200',
        gradient: 'from-cyan-950 via-slate-900 to-fuchsia-950',
        border: 'border-cyan-500/30',
        glow: 'shadow-[0_0_30px_rgba(34,211,238,0.1)]',
        chartColor: 'bg-cyan-500'
      };
    case PresentationStyle.Corporate:
      return {
        bg: 'bg-slate-800',
        text: 'text-white',
        accent: 'text-blue-400',
        sub: 'text-slate-300',
        gradient: 'from-blue-950 via-slate-900 to-slate-950',
        border: 'border-blue-500/20',
        glow: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]',
        chartColor: 'bg-blue-500'
      };
    case PresentationStyle.Minimalist:
      return {
        bg: 'bg-zinc-900',
        text: 'text-zinc-200',
        accent: 'text-zinc-400',
        sub: 'text-zinc-500',
        gradient: 'from-zinc-800 to-zinc-900',
        border: 'border-zinc-700',
        glow: '',
        chartColor: 'bg-zinc-400'
      };
    case PresentationStyle.Nature:
        return {
          bg: 'bg-stone-900',
          text: 'text-emerald-100',
          accent: 'text-emerald-400',
          sub: 'text-emerald-200',
          gradient: 'from-emerald-950 via-stone-900 to-stone-950',
          border: 'border-emerald-500/20',
          glow: 'shadow-[0_0_30px_rgba(52,211,153,0.1)]',
          chartColor: 'bg-emerald-500'
        };
    case PresentationStyle.Futuristic:
    default:
      return {
        bg: 'bg-black',
        text: 'text-indigo-300',
        accent: 'text-violet-400',
        sub: 'text-indigo-200',
        gradient: 'from-indigo-950 via-slate-950 to-black',
        border: 'border-indigo-500/40',
        glow: 'shadow-[0_0_30px_rgba(99,102,241,0.15)]',
        chartColor: 'bg-indigo-500'
      };
  }
};

/* 
  NOTE: 
  These components are designed to be rendered in a fixed container of 1280px x 720px.
  Responsive text sizing (md:text-xl) is largely removed in favor of fixed sizes 
  because the container itself is scaled via CSS transform in PresentationView.
*/

export const TitleSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeClasses(style);
  return (
    <div className={`h-full w-full flex flex-col justify-center items-center text-center p-16 bg-gradient-to-br ${theme.gradient} relative overflow-hidden slide-inner-content`}>
      {/* Hi-Tech Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-50 pointer-events-none"></div>
      
      {/* Laser Scan Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/20 animate-scanline opacity-30"></div>

      <div className="relative z-10 max-w-5xl">
        <h1 className={`text-8xl font-black mb-8 uppercase tracking-tighter leading-tight ${theme.text} drop-shadow-[0_0_25px_rgba(0,0,0,0.5)] animate-fade-in-up`}>
          {slide.title}
        </h1>
        {slide.subtitle && (
          <div className={`inline-block text-3xl font-light tracking-[0.3em] uppercase ${theme.accent} border-y border-white/10 py-6 px-12 backdrop-blur-sm animate-fade-in-up stagger-2`}>
            {slide.subtitle}
          </div>
        )}
      </div>
      
      {/* Decorative Circles */}
      <div className={`absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full border border-white/5 ${theme.glow} animate-pulse`}></div>
    </div>
  );
};

export const ContentSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeClasses(style);
  return (
    <div className={`h-full w-full p-16 bg-gradient-to-r ${theme.gradient} flex flex-col relative overflow-hidden slide-inner-content`}>
      {/* Background pattern */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] bg-[size:20px_20px]"></div>

      <h2 className={`text-6xl font-bold mb-12 uppercase tracking-tight ${theme.text} animate-fade-in-up border-b border-white/10 pb-8 max-w-6xl`}>
        {slide.title}
      </h2>
      <div className="flex-1 grid grid-cols-2 gap-16 items-center z-10">
        <ul className="space-y-8">
          {slide.bulletPoints?.map((point, i) => (
            <li 
              key={i} 
              className={`flex items-start text-3xl ${theme.sub} font-light leading-relaxed animate-fade-in-up`}
              style={{ animationDelay: `${(i+1) * 150}ms` }}
            >
              <span className={`mr-5 mt-3 w-3 h-3 shrink-0 ${theme.accent.replace('text', 'bg')} rotate-45 shadow-[0_0_10px_currentColor]`}></span>
              {point}
            </li>
          ))}
        </ul>
        
        <div className={`h-full max-h-[500px] w-full rounded-xl border ${theme.border} bg-white/5 backdrop-blur-md flex items-center justify-center relative overflow-hidden group animate-fade-in-up stagger-3 ${theme.glow}`}>
             <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${theme.gradient}`}></div>
             {/* Mock Hi-Tech UI inside visual */}
             <div className="absolute top-6 left-6 w-24 h-1 bg-white/20"></div>
             <div className="absolute bottom-6 right-6 w-24 h-1 bg-white/20"></div>
             <div className="absolute top-6 right-6 w-6 h-6 border border-white/20"></div>
             
             <div className="text-7xl opacity-20 font-black -rotate-12 scale-125 text-white mix-blend-overlay transition-transform duration-[10s] group-hover:scale-100">
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
  const maxVal = data?.datasets[0].data.reduce((a, b) => Math.max(a, b), 0) || 100;
  
  return (
    <div className={`h-full w-full p-16 bg-gradient-to-b ${theme.gradient} flex flex-col slide-inner-content`}>
      <h2 className={`text-5xl font-bold mb-8 uppercase tracking-widest ${theme.text} text-right border-b border-white/10 pb-6 animate-fade-in-up`}>
        {slide.title}
      </h2>
      <div className="flex-1 flex items-end justify-around gap-8 pb-16 px-12 relative">
         {/* Grid Lines */}
         <div className="absolute inset-0 pointer-events-none opacity-10 flex flex-col justify-end pb-16 px-12">
             <div className="w-full h-px bg-white mb-[20%]"></div>
             <div className="w-full h-px bg-white mb-[20%]"></div>
             <div className="w-full h-px bg-white mb-[20%]"></div>
             <div className="w-full h-px bg-white mb-[20%]"></div>
         </div>

        {data?.labels.map((label, i) => {
          const val = data.datasets[0].data[i];
          const heightPerc = (val / maxVal) * 80;
          return (
            <div key={i} className="flex flex-col items-center gap-6 group w-full max-w-[140px]">
              <div className="w-full relative h-[450px] flex items-end justify-center">
                 {/* Animated Bar */}
                 <div 
                    style={{ height: `${heightPerc}%`, animationDelay: `${i * 150 + 300}ms` }} 
                    className={`w-full mx-2 rounded-t-sm ${theme.accent.replace('text', 'bg')} opacity-90 shadow-[0_0_20px_currentColor] relative animate-grow-up hover:opacity-100 transition-all duration-300`}
                 >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 </div>
                 {/* Floating Value */}
                 <span className="absolute bottom-[calc(100%+10px)] text-3xl font-black text-white/20 group-hover:text-white transition-colors animate-fade-in-up" style={{ bottom: `${heightPerc + 2}%`, animationDelay: `${i * 150 + 600}ms` }}>
                    {val}
                 </span>
              </div>
              <span className="text-lg text-slate-400 font-bold uppercase tracking-wider text-center">{label}</span>
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
    <div className={`h-full w-full p-16 bg-gradient-to-bl ${theme.gradient} flex flex-col slide-inner-content`}>
       <h2 className={`text-6xl font-bold mb-12 uppercase ${theme.text} animate-fade-in-up`}>
        {slide.title}
      </h2>
      <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl animate-fade-in-up stagger-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {slide.tableData?.headers.map((h, i) => (
                <th key={i} className={`p-8 text-2xl font-bold uppercase tracking-wider border-b border-white/10 ${theme.accent} bg-black/40`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-2xl text-slate-300">
            {slide.tableData?.rows.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/10 transition-colors group">
                {row.map((cell, j) => (
                  <td key={j} className="p-8 font-light group-hover:text-white transition-colors">{cell}</td>
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
    <div className={`h-full w-full p-16 bg-gradient-to-tr ${theme.gradient} flex flex-col slide-inner-content`}>
      <h2 className={`text-6xl font-bold mb-24 text-center uppercase tracking-[0.2em] ${theme.text} animate-fade-in-up`}>
        {slide.title}
      </h2>
      <div className="flex-1 flex items-center justify-center relative px-12 gap-16">
         {/* Connecting Line */}
         <div className="absolute top-[50px] left-[10%] right-[10%] h-1 bg-white/10 -z-0">
            <div className="absolute top-0 left-0 h-full bg-current w-full animate-pulse opacity-50 scale-x-0 animate-grow-up" style={{ transformOrigin: 'left' }}></div>
         </div>

         {slide.processSteps?.map((step, i) => (
           <div key={i} className="relative z-10 flex flex-col items-center text-center w-full max-w-[320px] group animate-fade-in-up" style={{ animationDelay: `${i * 200 + 300}ms` }}>
             {/* Icon/Number Node */}
             <div className={`w-24 h-24 shrink-0 rounded-2xl flex items-center justify-center text-4xl font-bold mb-10 ${theme.bg} border-2 ${theme.border} ${theme.accent} shadow-[0_0_30px_currentColor] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
               {i + 1}
             </div>
             <div>
               <h3 className="text-3xl font-bold text-white mb-4">{step.title}</h3>
               <p className="text-xl text-slate-400 leading-relaxed">{step.description}</p>
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
