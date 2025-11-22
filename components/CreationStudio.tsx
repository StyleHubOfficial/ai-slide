
import React, { useState } from 'react';
import { PresentationStyle } from '../types';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import Label from './ui/Label';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import Spinner from './ui/Spinner';
import ImageIcon from './icons/ImageIcon';

interface CreationStudioProps {
  onCreate: (topic: string, style: PresentationStyle, fileContext: string, slideCount: number) => void;
  isLoading: boolean;
}

type Mode = 'GENERATE' | 'CONVERT';

const CreationStudio: React.FC<CreationStudioProps> = ({ onCreate, isLoading }) => {
  const [mode, setMode] = useState<Mode>('GENERATE');
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<PresentationStyle>(PresentationStyle.Cyberpunk);
  const [fileContext, setFileContext] = useState('');
  const [fileName, setFileName] = useState('');
  const [slideCount, setSlideCount] = useState(6);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const text = await file.text();
      setFileContext(text.slice(0, 8000)); // Context limit
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col lg:flex-row overflow-hidden font-sans selection:bg-sky-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-900/20 blur-[120px]"></div>
      </div>

      {/* Sidebar (Desktop) / Topbar (Mobile) */}
      <aside className="w-full lg:w-64 h-auto lg:h-full border-b lg:border-b-0 lg:border-r border-white/5 bg-slate-900/50 backdrop-blur-xl flex flex-row lg:flex-col items-center lg:items-start py-4 lg:py-8 z-10 shrink-0 justify-between lg:justify-start px-4 lg:px-0">
         <div className="px-0 lg:px-6 lg:mb-12 flex items-center gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
               <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className="font-black text-lg lg:text-xl tracking-tight text-white">Lumina</span>
         </div>

         <nav className="hidden lg:flex flex-col flex-1 w-full px-4 space-y-2">
            <button 
               onClick={() => setMode('GENERATE')}
               className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${mode === 'GENERATE' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
            >
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M3.343 19.05l.707-.707M18.364 19.05l-.707-.707M6.343 4.636l-.707-.707M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
               <span className="font-medium">AI Generator</span>
            </button>
            <button 
               onClick={() => setMode('CONVERT')}
               className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${mode === 'CONVERT' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
            >
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
               <span className="font-medium">File Converter</span>
            </button>
         </nav>

         {/* Mobile Tabs */}
         <div className="lg:hidden flex gap-2">
             <button onClick={() => setMode('GENERATE')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${mode === 'GENERATE' ? 'bg-sky-600 text-white' : 'bg-white/5 text-slate-400'}`}>Generate</button>
             <button onClick={() => setMode('CONVERT')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${mode === 'CONVERT' ? 'bg-sky-600 text-white' : 'bg-white/5 text-slate-400'}`}>Convert</button>
         </div>

         <div className="hidden lg:block px-6 w-full mt-auto">
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5">
               <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Designed & Developed by</p>
               <p className="text-sm font-bold text-white tracking-wide">Lakshya</p>
               <div className="w-full h-0.5 bg-gradient-to-r from-sky-500 to-transparent mt-2 opacity-50"></div>
            </div>
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 p-4 lg:p-12 flex flex-col items-center">
        
        <div className="w-full max-w-4xl animate-fade-in-up pb-20 lg:pb-0">
          <header className="mb-8 lg:mb-12 text-center lg:text-left">
             <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                {mode === 'GENERATE' ? 'Architect your Vision' : 'Transform your Documents'}
             </h1>
             <p className="text-slate-400 text-sm lg:text-lg">
                {mode === 'GENERATE' 
                   ? 'Turn simple text prompts into professional, high-tech slide decks instantly.' 
                   : 'Upload PDF, PPT, or Text files to generate structured, animated presentations.'}
             </p>
          </header>

          <GlassCard className="p-6 md:p-12 border-slate-700/50 bg-slate-900/40">
             <div className="space-y-8">
                
                {/* Input Area */}
                {mode === 'GENERATE' ? (
                   <div>
                      <Label className="text-sky-400 mb-3">What would you like to present?</Label>
                      <Textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. A strategic roadmap for Q4 marketing with focus on social media growth..."
                        className="h-32 text-base lg:text-lg bg-black/20 border-white/10 focus:border-sky-500/50"
                      />
                   </div>
                ) : (
                   <div className="relative group">
                      <Label className="text-sky-400 mb-3">Upload Document (PDF, PPT, TXT)</Label>
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800/30 hover:border-sky-500 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(14,165,233,0.1)]">
                         <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="w-12 h-12 text-slate-500 mb-3 group-hover:text-sky-400 transition-colors" />
                            {fileName ? (
                               <p className="text-base text-sky-400 font-semibold">{fileName}</p>
                            ) : (
                               <>
                                  <p className="text-sm text-slate-400 font-medium">Drag & Drop or Click to Upload</p>
                                  <p className="text-xs text-slate-600 mt-2">Supports text extraction for context</p>
                               </>
                            )}
                         </div>
                         <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.json,.csv,.pdf" />
                      </label>
                      {fileName && (
                         <div className="mt-4">
                            <Label className="text-slate-400">Presentation Topic based on file</Label>
                            <Textarea 
                               value={topic} 
                               onChange={e => setTopic(e.target.value)} 
                               placeholder="Briefly describe what to extract from the file..."
                               className="h-20 bg-black/20 border-white/10"
                            />
                         </div>
                      )}
                   </div>
                )}

                {/* Configuration Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                      <Label className="text-slate-400">Visual Style</Label>
                      <Select
                         value={style}
                         onChange={(e) => setStyle(e.target.value as PresentationStyle)}
                         className="h-12 bg-black/20 border-white/10"
                      >
                         {Object.values(PresentationStyle).map((s) => (
                            <option key={s} value={s}>{s}</option>
                         ))}
                      </Select>
                   </div>
                   <div>
                      <Label className="text-slate-400">Length: {slideCount} Slides</Label>
                      <div className="h-12 flex items-center">
                         <input 
                            type="range" 
                            min="3" 
                            max="15" 
                            value={slideCount} 
                            onChange={(e) => setSlideCount(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                         />
                      </div>
                   </div>
                </div>

                <div className="pt-4">
                   <Button 
                      onClick={() => onCreate(topic || (fileName ? `Presentation about ${fileName}` : ''), style, fileContext, slideCount)}
                      disabled={isLoading || (!topic && !fileName)}
                      className="w-full h-14 text-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] border border-white/10"
                   >
                      {isLoading ? (
                         <span className="flex items-center gap-3">
                            <Spinner className="w-6 h-6" /> 
                            {mode === 'GENERATE' ? 'Architecting...' : 'Analyzing...'}
                         </span>
                      ) : (
                         mode === 'GENERATE' ? 'Generate Presentation' : 'Convert to Slides'
                      )}
                   </Button>
                </div>

             </div>
          </GlassCard>
        </div>
        
        <div className="lg:hidden mt-8 p-4 rounded-xl bg-white/5 w-full text-center">
            <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Designed by</p>
            <p className="text-sm font-bold text-white tracking-wide">Lakshya</p>
        </div>

      </main>
    </div>
  );
};

export default CreationStudio;
