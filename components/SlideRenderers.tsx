
import React from 'react';
import { Slide, PresentationStyle } from '../types';

interface SlideProps {
  slide: Slide;
  style: PresentationStyle;
}

// Helper to get sophisticated theme visuals
const getThemeVisuals = (style: PresentationStyle) => {
  switch (style) {
    case PresentationStyle.Blackboard:
      return {
        // Classic Classroom Blackboard
        containerClass: 'bg-[#1a2e1a] text-white',
        bgStyle: {
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 80%),
            url("https://www.transparenttextures.com/patterns/blackboard.png")
          `, // Subtle texture overlay pattern (simulated) or just noise
          backgroundSize: 'cover, auto'
        },
        fontTitle: 'font-chalk tracking-widest',
        fontBody: 'font-chalk tracking-wide',
        text: 'text-white/90 drop-shadow-[1px_1px_2px_rgba(0,0,0,0.8)]',
        accent: 'text-yellow-200',
        sub: 'text-white/70',
        border: 'border-white/20 border-dashed',
        glass: 'bg-white/5 border-white/10 shadow-none backdrop-blur-[1px]',
        chartColor: 'bg-yellow-100', // Chalk yellow
        processCircle: 'bg-transparent border-2 border-white text-white',
        bullet: 'bg-white'
      };
    case PresentationStyle.Whiteboard:
      return {
        // Modern Whiteboard
        containerClass: 'bg-white text-slate-800',
        bgStyle: {
          backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        },
        fontTitle: 'font-marker',
        fontBody: 'font-marker',
        text: 'text-slate-800',
        accent: 'text-blue-600',
        sub: 'text-slate-500',
        border: 'border-slate-300',
        glass: 'bg-transparent border-slate-300 shadow-none',
        chartColor: 'bg-blue-600',
        processCircle: 'bg-white border-2 border-blue-600 text-blue-600',
        bullet: 'bg-blue-600'
      };
    case PresentationStyle.Notebook:
      return {
        // Ruled Paper Notebook
        containerClass: 'bg-[#fdfbf7] text-slate-700',
        bgStyle: {
          backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)',
          backgroundSize: '100% 2rem',
          marginTop: '0px'
        },
        fontTitle: 'font-hand font-bold',
        fontBody: 'font-hand text-xl leading-[2rem]',
        text: 'text-slate-700',
        accent: 'text-red-500',
        sub: 'text-slate-500',
        border: 'border-slate-400 border-2',
        glass: 'bg-[#fefce8]/50 border-slate-300 shadow-sm rotate-1',
        chartColor: 'bg-slate-700',
        processCircle: 'bg-white border-2 border-slate-700 text-slate-700',
        bullet: 'bg-slate-700'
      };
    case PresentationStyle.Blueprint:
      return {
        // Technical Blueprint
        containerClass: 'bg-[#1e3a8a] text-white',
        bgStyle: {
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        },
        fontTitle: 'font-draft', // Architect font
        fontBody: 'font-draft',
        text: 'text-blue-50',
        accent: 'text-cyan-300',
        sub: 'text-blue-200',
        border: 'border-white/40',
        glass: 'bg-blue-900/50 border-white/30',
        chartColor: 'bg-white',
        processCircle: 'bg-blue-900 border-2 border-white text-white',
        bullet: 'bg-white'
      };
    case PresentationStyle.DigitalPad:
    default:
      return {
        // Dark Mode Tablet
        containerClass: 'bg-slate-900 text-white',
        bgStyle: {
          background: 'linear-gradient(to bottom right, #0f172a, #1e293b)'
        },
        fontTitle: 'font-sans font-bold',
        fontBody: 'font-sans',
        text: 'text-white',
        accent: 'text-sky-400',
        sub: 'text-slate-300',
        border: 'border-white/10',
        glass: 'bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl',
        chartColor: 'bg-sky-500',
        processCircle: 'bg-white/10 border-sky-400 text-white',
        bullet: 'bg-sky-400'
      };
  }
};

export const getAIImageUrl = (prompt: string, style: PresentationStyle) => {
    // Inject style context into the image generation prompt
    let styleModifier = "";
    switch(style) {
        case PresentationStyle.Blackboard: styleModifier = "chalk drawing on blackboard, white chalk lines on dark green background, sketch style, rough textures"; break;
        case PresentationStyle.Whiteboard: styleModifier = "marker drawing on whiteboard, dry erase marker style, white background, hand drawn"; break;
        case PresentationStyle.Notebook: styleModifier = "pen sketch on paper, doodle style, ink drawing, hand drawn on white paper"; break;
        case PresentationStyle.Blueprint: styleModifier = "blueprint schematic, white technical lines on blue background, architectural style"; break;
        default: styleModifier = "digital art, sleek, modern, vector illustration"; break;
    }

    const enhancedPrompt = `${prompt}, ${styleModifier}, high quality, clear details`;
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${Math.random()}`;
}

const SlideContainer: React.FC<{ children: React.ReactNode, theme: any, slide: Slide, style: PresentationStyle }> = ({ children, theme, slide, style }) => {
    // Generate background visualization if prompt exists
    const bgImage = slide.imagePrompt ? getAIImageUrl(slide.imagePrompt, style) : null;
    
    return (
        <div 
            className={`h-full w-full relative overflow-hidden flex flex-col p-12 slide-inner-content ${theme.containerClass}`}
            style={theme.bgStyle}
        >
             {/* Study Theme specific decorative elements */}
            {style === PresentationStyle.Notebook && (
                <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-red-400/30 h-full z-0"></div>
            )}
            
            {/* Optional AI Background Layer with Blend Mode */}
            {bgImage && (
                <>
                    <div 
                        className={`absolute top-0 right-0 w-1/2 h-full bg-contain bg-right bg-no-repeat transition-opacity duration-1000 opacity-60 mix-blend-overlay`} 
                        style={{ backgroundImage: `url(${bgImage})` }}
                    ></div>
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
    <SlideContainer theme={theme} slide={slide} style={style}>
      <div className="h-full flex flex-col justify-center items-center text-center">
          <div className={`p-12 rounded-lg border-2 ${theme.border} ${theme.glass} transform rotate-1`}>
            <h1 className={`text-6xl md:text-7xl mb-6 ${theme.fontTitle} ${theme.text} animate-fade-in-up`}>
            {slide.title}
            </h1>
            {slide.subtitle && (
            <div className={`text-3xl ${theme.fontBody} ${theme.accent} animate-fade-in-up stagger-2`}>
                {slide.subtitle}
            </div>
            )}
            <div className="mt-8 border-t-2 border-current w-1/2 mx-auto opacity-30"></div>
          </div>
      </div>
    </SlideContainer>
  );
};

export const ContentSlide: React.FC<SlideProps> = ({ slide, style }) => {
  const theme = getThemeVisuals(style);
  return (
    <SlideContainer theme={theme} slide={slide} style={style}>
      <h2 className={`text-5xl mb-10 ${theme.fontTitle} ${theme.text} underline decoration-wavy decoration-opacity-30 decoration-current`}>
        {slide.title}
      </h2>
      
      <div className="flex-1 grid grid-cols-12 gap-12 items-start">
        <div className={`col-span-7 h-full`}>
            <ul className="space-y-6">
            {slide.bulletPoints?.map((point, i) => (
                <li 
                key={i} 
                className={`flex items-start text-2xl ${theme.fontBody} ${theme.sub} leading-relaxed animate-fade-in-up`}
                style={{ animationDelay: `${i * 100}ms` }}
                >
                <span className={`mr-4 mt-3 w-3 h-3 shrink-0 rounded-full ${theme.bullet} shadow-sm opacity-80`}></span>
                <span>{point}</span>
                </li>
            ))}
            </ul>
        </div>
        
        {/* Visual Sidebar - Polaroid/Sketch style */}
        <div className={`col-span-5 h-[80%] mt-8 transform -rotate-2 rounded-sm border-8 ${style === PresentationStyle.Blackboard ? 'border-white/10' : 'border-white'} shadow-xl bg-white relative overflow-hidden group`}>
             {slide.imagePrompt ? (
                <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: `url(${getAIImageUrl(slide.imagePrompt, style)})` }}
                ></div>
             ) : (
                <div className="flex items-center justify-center h-full text-slate-300">No Sketch</div>
             )}
             
             {style !== PresentationStyle.Blackboard && (
                <div className="absolute bottom-0 inset-x-0 h-12 bg-white flex items-center justify-center">
                    <span className="font-hand text-slate-800 text-sm">Figure 1.{Math.floor(Math.random() * 9)}</span>
                </div>
             )}
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
    <SlideContainer theme={theme} slide={slide} style={style}>
      <h2 className={`text-5xl mb-8 ${theme.fontTitle} ${theme.text} text-center`}>
        {slide.title}
      </h2>
      <div className={`flex-1 flex items-end justify-around gap-8 pb-12 px-12 border-b-2 border-l-2 ${theme.border} m-8 relative`}>
        {data?.labels.map((label, i) => {
          const val = data.datasets[0].data[i];
          const heightPerc = Math.max((val / maxVal) * 80, 5); 
          return (
            <div key={i} className="flex flex-col items-center gap-2 group w-full h-full justify-end z-10">
              <div className="w-full relative h-full flex items-end justify-center">
                 {/* Sketchy Bar */}
                 <div 
                    style={{ 
                        height: `${heightPerc}%`, 
                        animationDelay: `${i * 100 + 300}ms`,
                        borderRadius: '2px 2px 0 0',
                        maskImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnPjxyZWN0IHg9JzAlJyB5PScwJScgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgZmlsbD0nYmxhY2snLz48L3N2Zz4=")' // Placeholder for noise mask if needed
                    }} 
                    className={`w-12 md:w-20 ${theme.chartColor} opacity-90 relative animate-grow-up hover:opacity-100 transition-all shadow-sm`}
                 >
                    {/* Scribble effect overlay could go here */}
                 </div>
                 <span className={`absolute bottom-[calc(${heightPerc}%+5px)] text-xl ${theme.fontBody} ${theme.accent} font-bold`}>
                    {val}
                 </span>
              </div>
              <span className={`text-lg ${theme.fontBody} ${theme.sub} text-center mt-2`}>{label}</span>
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
    <SlideContainer theme={theme} slide={slide} style={style}>
       <h2 className={`text-5xl mb-10 ${theme.fontTitle} ${theme.text} animate-fade-in-up`}>
        {slide.title}
      </h2>
      <div className={`flex-1 overflow-hidden p-4`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {slide.tableData?.headers.map((h, i) => (
                <th key={i} className={`p-4 text-2xl ${theme.fontTitle} border-b-2 ${theme.border} ${theme.accent}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`text-xl ${theme.fontBody} ${theme.sub}`}>
            {slide.tableData?.rows.map((row, i) => (
              <tr key={i} className={`border-b ${theme.border}`}>
                {row.map((cell, j) => (
                  <td key={j} className="p-4">{cell}</td>
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
    <SlideContainer theme={theme} slide={slide} style={style}>
      <h2 className={`text-5xl font-bold mb-20 text-center ${theme.fontTitle} ${theme.text} animate-fade-in-up`}>
        {slide.title}
      </h2>
      <div className="flex-1 flex items-center justify-center relative px-8 gap-8">
         {/* Connector Line - Hand drawn style */}
         <svg className="absolute top-[60px] left-[10%] right-[10%] h-4 w-[80%] overflow-visible pointer-events-none">
             <path d="M0,2 Q400,10 1000,0" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10,5" className="opacity-40" />
         </svg>

         {slide.processSteps?.map((step, i) => (
           <div key={i} className="relative z-10 flex flex-col items-center text-center w-full max-w-[300px] group animate-fade-in-up" style={{ animationDelay: `${i * 200 + 300}ms` }}>
             <div className={`w-24 h-24 shrink-0 rounded-full flex items-center justify-center text-4xl ${theme.fontTitle} mb-6 ${theme.processCircle} group-hover:scale-110 transition-transform shadow-lg bg-black/20 backdrop-blur-sm`}>
               {i + 1}
             </div>
             <div className={`p-4`}>
                <h3 className={`text-2xl font-bold mb-2 ${theme.fontTitle} ${theme.text}`}>{step.title}</h3>
                <p className={`text-lg ${theme.fontBody} ${theme.sub}`}>{step.description}</p>
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
