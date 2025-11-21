import React, { useState } from 'react';
import { PresentationStyle } from '../types';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import Label from './ui/Label';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import Spinner from './ui/Spinner';

interface CreationStudioProps {
  onCreate: (topic: string, style: PresentationStyle, fileContext: string, slideCount: number) => void;
  isLoading: boolean;
}

const CreationStudio: React.FC<CreationStudioProps> = ({ onCreate, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<PresentationStyle>(PresentationStyle.Cyberpunk);
  const [fileContext, setFileContext] = useState('');
  const [fileName, setFileName] = useState('');
  const [slideCount, setSlideCount] = useState(6);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // Basic text reading for context
      const text = await file.text();
      setFileContext(text.slice(0, 5000)); // Limit context size
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 relative z-10 overflow-y-auto">
      
      {/* Background Accents */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-600/20 blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[100px]"></div>
      </div>

      <div className="text-center mb-6 md:mb-10 animate-fade-in-up shrink-0">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 tracking-tighter uppercase">
          Lumina
        </h1>
        <p className="text-sm md:text-xl text-slate-400 mt-2 font-light tracking-wide uppercase">
          AI Presentation Architect
        </p>
      </div>

      <GlassCard className="w-full max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="space-y-6 md:space-y-8">
          
          {/* Topic */}
          <div>
            <Label className="text-sky-300 uppercase tracking-wider text-xs font-bold">Presentation Topic</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The Future of Quantum Computing in Finance..."
              className="bg-slate-900/50 border-slate-700 text-base md:text-lg h-24 md:h-32 focus:ring-sky-500/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Style Selector */}
            <div>
              <Label className="text-sky-300 uppercase tracking-wider text-xs font-bold">Visual Style</Label>
              <Select
                value={style}
                onChange={(e) => setStyle(e.target.value as PresentationStyle)}
                className="bg-slate-900/50 border-slate-700"
              >
                {Object.values(PresentationStyle).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>

             {/* Slide Count */}
             <div>
              <Label className="text-sky-300 uppercase tracking-wider text-xs font-bold">Slide Count: {slideCount}</Label>
              <input 
                type="range" 
                min="3" 
                max="12" 
                value={slideCount} 
                onChange={(e) => setSlideCount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 mt-3"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="relative group">
            <Label className="text-sky-300 uppercase tracking-wider text-xs font-bold">Context Source (Optional)</Label>
            <label className="flex flex-col items-center justify-center w-full h-20 md:h-24 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800/50 hover:border-sky-500 transition-all duration-300">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {fileName ? (
                  <p className="text-sm text-sky-400 font-semibold px-4 text-center truncate w-full">{fileName}</p>
                ) : (
                  <>
                    <p className="text-sm text-slate-400"><span className="font-semibold">Click to upload</span> text, pdf, or ppt</p>
                    <p className="text-xs text-slate-500">Supports text extraction for context</p>
                  </>
                )}
              </div>
              <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.json,.csv,.pdf" />
            </label>
          </div>

          <Button 
            onClick={() => onCreate(topic, style, fileContext, slideCount)} 
            disabled={isLoading || !topic}
            className="w-full h-12 md:h-14 text-base md:text-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-white/10"
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <Spinner className="w-6 h-6" /> Architecting...
              </span>
            ) : (
              'Initialize Deck Generation'
            )}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export default CreationStudio;