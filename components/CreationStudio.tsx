
import React, { useState } from 'react';
import { PresentationStyle, SharedPresentation } from '../types';
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

type Tab = 'HOME' | 'CREATE' | 'COMMUNITY';

// Mock Community Data
const MOCK_COMMUNITY_DECKS: SharedPresentation[] = [
  {
    id: 'c1',
    topic: 'Future of AI',
    title: 'The Generative Age',
    author: 'Sarah Connors',
    style: PresentationStyle.Futuristic,
    likes: 124,
    downloads: 45,
    sharedBy: 'SarahC',
    dateShared: '2h ago',
    slides: [] // Mock
  },
  {
    id: 'c2',
    topic: 'Sustainable Energy',
    title: 'Green Tech Revolution',
    author: 'EcoLabs',
    style: PresentationStyle.Nature,
    likes: 89,
    downloads: 12,
    sharedBy: 'GreenGuy',
    dateShared: '5h ago',
    slides: [] // Mock
  },
  {
    id: 'c3',
    topic: 'Q4 Strategy',
    title: 'Q4 Marketing Blitz',
    author: 'Corp Dynamics',
    style: PresentationStyle.Corporate,
    likes: 256,
    downloads: 110,
    sharedBy: 'BizMaster',
    dateShared: '1d ago',
    slides: [] // Mock
  }
];

const CreationStudio: React.FC<CreationStudioProps> = ({ onCreate, isLoading }) => {
  const [activeTab, setActiveTab] = useState<Tab>('HOME'); // Default to HOME (Converter on mobile)
  
  // Generator State
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<PresentationStyle>(PresentationStyle.Cyberpunk);
  const [slideCount, setSlideCount] = useState(8);

  // Converter State (Home)
  const [fileContext, setFileContext] = useState('');
  const [fileName, setFileName] = useState('');

  // Community State
  const [communityDecks, setCommunityDecks] = useState<SharedPresentation[]>(MOCK_COMMUNITY_DECKS);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const text = await file.text();
      setFileContext(text.slice(0, 8000));
    }
  };

  const handleSimulatedUpload = () => {
    setUploading(true);
    setTimeout(() => {
        const newDeck: SharedPresentation = {
            id: Math.random().toString(),
            topic: fileName || topic || "Untitled Project",
            title: fileName || topic || "Untitled Project",
            author: "You",
            style: style,
            likes: 0,
            downloads: 0,
            sharedBy: "You",
            dateShared: "Just now",
            slides: []
        };
        setCommunityDecks([newDeck, ...communityDecks]);
        setUploading(false);
        alert("Published to Community Hub successfully!");
    }, 1500);
  };

  const renderContent = () => {
    switch (activeTab) {
        case 'HOME': // FILE CONVERTER (Default on Mobile)
            return (
                <div className="w-full max-w-4xl animate-fade-in-up pb-24 lg:pb-0">
                    <header className="mb-8 lg:mb-12 text-center lg:text-left">
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                           Transform Documents
                        </h1>
                        <p className="text-slate-400 text-sm lg:text-lg">
                           Upload PDF, PPT, or Text files to convert them into high-tech animated presentations instantly.
                        </p>
                    </header>

                    <GlassCard className="p-6 md:p-12 border-slate-700/50 bg-slate-900/40">
                         <div className="relative group mb-8">
                            <Label className="text-sky-400 mb-3">Upload Document</Label>
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800/30 hover:border-sky-500 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(14,165,233,0.1)]">
                               <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <ImageIcon className="w-16 h-16 text-slate-500 mb-4 group-hover:text-sky-400 transition-colors" />
                                  {fileName ? (
                                     <p className="text-lg text-sky-400 font-semibold">{fileName}</p>
                                  ) : (
                                     <>
                                        <p className="text-base text-slate-400 font-medium">Click to Upload PDF or PPT</p>
                                        <p className="text-xs text-slate-600 mt-2">AI extracts key insights automatically</p>
                                     </>
                                  )}
                               </div>
                               <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.json,.csv,.pdf,.pptx" />
                            </label>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4 mb-8">
                             <div>
                                <Label>Visual Style</Label>
                                <Select value={style} onChange={(e) => setStyle(e.target.value as PresentationStyle)}>
                                    {Object.values(PresentationStyle).map(s => <option key={s} value={s}>{s}</option>)}
                                </Select>
                             </div>
                             <div>
                                <Label>Slides</Label>
                                <Select value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))}>
                                    {[5, 8, 10, 12, 15].map(n => <option key={n} value={n}>{n} Slides</option>)}
                                </Select>
                             </div>
                         </div>

                         <Button 
                            onClick={() => onCreate(fileName ? `Presentation about ${fileName}` : topic, style, fileContext, slideCount)}
                            disabled={isLoading || !fileName}
                            className="w-full h-14 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg"
                         >
                            {isLoading ? <span className="flex items-center gap-2"><Spinner className="w-5 h-5"/> Processing File...</span> : 'Convert to Presentation'}
                         </Button>
                    </GlassCard>
                </div>
            );

        case 'CREATE': // AI GENERATOR
            return (
                <div className="w-full max-w-4xl animate-fade-in-up pb-24 lg:pb-0">
                    <header className="mb-8 lg:mb-12 text-center lg:text-left">
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                           Architect your Vision
                        </h1>
                        <p className="text-slate-400 text-sm lg:text-lg">
                           Describe your idea and let Gemini 2.5 Flash architect a cinematic deck for you.
                        </p>
                    </header>

                    <GlassCard className="p-6 md:p-12 border-slate-700/50 bg-slate-900/40">
                         <div className="mb-8">
                            <Label className="text-sky-400 mb-3">Topic / Prompt</Label>
                            <Textarea
                              value={topic}
                              onChange={(e) => setTopic(e.target.value)}
                              placeholder="e.g. A pitch deck for a new AI startup revolutionizing healthcare..."
                              className="h-40 text-lg bg-black/20 border-white/10 focus:border-sky-500/50"
                            />
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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
                               <Label className="text-slate-400">Length</Label>
                               <input 
                                  type="range" 
                                  min="3" 
                                  max="15" 
                                  value={slideCount} 
                                  onChange={(e) => setSlideCount(parseInt(e.target.value))}
                                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 mt-5"
                               />
                               <div className="text-right text-xs text-sky-400 mt-1">{slideCount} Slides</div>
                            </div>
                         </div>

                         <Button 
                            onClick={() => onCreate(topic, style, '', slideCount)}
                            disabled={isLoading || !topic}
                            className="w-full h-14 text-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg"
                         >
                            {isLoading ? <span className="flex items-center gap-2"><Spinner className="w-5 h-5"/> Architecting...</span> : 'Generate Presentation'}
                         </Button>
                    </GlassCard>
                </div>
            );

        case 'COMMUNITY': // COMMUNITY HUB
            return (
                <div className="w-full max-w-5xl animate-fade-in-up pb-24 lg:pb-0">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Community Hub</h1>
                            <p className="text-slate-400">Explore, remix, and share decks from around the world.</p>
                        </div>
                        <Button 
                            onClick={handleSimulatedUpload} 
                            disabled={uploading}
                            className="bg-white/10 border border-white/20 hover:bg-white/20"
                        >
                            {uploading ? <Spinner className="w-4 h-4"/> : 'Upload to Public'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communityDecks.map((deck) => (
                            <GlassCard key={deck.id} className="p-0 overflow-hidden group border-white/10 hover:border-sky-500/50 transition-all">
                                <div className={`h-32 w-full bg-gradient-to-br ${getGradient(deck.style)} relative`}>
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                                    <div className="absolute bottom-3 left-4 right-4">
                                        <h3 className="text-white font-bold truncate shadow-black drop-shadow-md">{deck.title}</h3>
                                        <p className="text-xs text-white/80">{deck.style}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-900/80">
                                    <div className="flex justify-between items-center text-xs text-slate-400 mb-4">
                                        <div className="flex items-center gap-1">
                                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-orange-500"></div>
                                            <span>@{deck.sharedBy}</span>
                                        </div>
                                        <span>{deck.dateShared}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 rounded bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 flex items-center justify-center gap-2">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                                            {deck.likes}
                                        </button>
                                        <button className="flex-1 py-2 rounded bg-sky-600/20 hover:bg-sky-600/30 text-xs font-bold text-sky-400 flex items-center justify-center gap-2">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            );
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col lg:flex-row overflow-hidden font-sans selection:bg-sky-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-900/20 blur-[120px]"></div>
      </div>

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden lg:flex w-64 h-full border-r border-white/5 bg-slate-900/50 backdrop-blur-xl flex-col py-8 z-10 shrink-0">
         <div className="px-6 mb-12 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
               <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className="font-black text-xl tracking-tight text-white">Lumina</span>
         </div>

         <nav className="flex flex-col flex-1 w-full px-4 space-y-2">
            <SidebarBtn label="File Converter" icon="home" active={activeTab === 'HOME'} onClick={() => setActiveTab('HOME')} />
            <SidebarBtn label="AI Generator" icon="spark" active={activeTab === 'CREATE'} onClick={() => setActiveTab('CREATE')} />
            <SidebarBtn label="Community Hub" icon="globe" active={activeTab === 'COMMUNITY'} onClick={() => setActiveTab('COMMUNITY')} />
         </nav>

         <div className="px-6 mt-auto">
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5">
               <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Designed & Developed by</p>
               <p className="text-sm font-black tracking-wide animate-text-shimmer">Lakshya</p>
               <div className="w-full h-0.5 bg-gradient-to-r from-sky-500 to-transparent mt-2 opacity-50"></div>
            </div>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10 p-4 lg:p-12 flex flex-col items-center">
         {/* Mobile Header */}
         <div className="lg:hidden w-full flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </div>
                 <span className="font-black text-lg text-white">Lumina</span>
            </div>
            {/* Developer Credit Mobile */}
             <div className="text-right">
               <p className="text-[10px] uppercase text-slate-500 font-bold">Dev by</p>
               <p className="text-xs font-black animate-text-shimmer">Lakshya</p>
            </div>
         </div>

         {renderContent()}

      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around z-50 pb-safe">
         <NavBtn icon="home" label="Home" active={activeTab === 'HOME'} onClick={() => setActiveTab('HOME')} />
         
         {/* Center Create Button */}
         <div className="relative -top-5">
             <button 
                onClick={() => setActiveTab('CREATE')}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-sky-500/40 transition-transform active:scale-95 ${activeTab === 'CREATE' ? 'bg-white text-sky-600' : 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white'}`}
             >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
             </button>
         </div>

         <NavBtn icon="globe" label="Community" active={activeTab === 'COMMUNITY'} onClick={() => setActiveTab('COMMUNITY')} />
      </div>

    </div>
  );
};

// UI Helper Components

const SidebarBtn: React.FC<{label: string, icon: string, active: boolean, onClick: () => void}> = ({ label, icon, active, onClick }) => (
    <button 
       onClick={onClick}
       className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
    >
       {getIcon(icon)}
       <span className="font-medium">{label}</span>
    </button>
);

const NavBtn: React.FC<{label: string, icon: string, active: boolean, onClick: () => void}> = ({ label, icon, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 w-16 ${active ? 'text-sky-400' : 'text-slate-500'}`}>
        {getIcon(icon)}
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

const getIcon = (name: string) => {
    switch(name) {
        case 'home': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
        case 'spark': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
        case 'globe': return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
        default: return null;
    }
}

const getGradient = (style: PresentationStyle) => {
    switch (style) {
        case PresentationStyle.Cyberpunk: return 'from-cyan-900 to-fuchsia-900';
        case PresentationStyle.Nature: return 'from-emerald-900 to-teal-900';
        case PresentationStyle.Corporate: return 'from-blue-900 to-slate-900';
        case PresentationStyle.Minimalist: return 'from-zinc-800 to-zinc-900';
        default: return 'from-indigo-900 to-purple-900';
    }
}

export default CreationStudio;
