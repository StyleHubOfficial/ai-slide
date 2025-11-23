
import React, { useState, useEffect } from 'react';
import { PresentationStyle, SharedPresentation, Presentation } from '../types';
import { communityService } from '../services/communityService';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import Label from './ui/Label';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import ImageIcon from './icons/ImageIcon';
import UploadIcon from './icons/UploadIcon';
import ShareIcon from './icons/ShareIcon';
import XIcon from './icons/XIcon';
import LoadingOverlay from './ui/LoadingOverlay';

interface CreationStudioProps {
  onCreate: (topic: string, style: PresentationStyle, fileContext: string, slideCount: number) => void;
  onOpenHistory: (presentation: Presentation) => void;
  onCancelLoading: () => void;
  isLoading: boolean;
}

type Tab = 'HOME' | 'CREATE' | 'COMMUNITY';

const THEMES = [
    { id: PresentationStyle.NeonGrid, label: 'Neon Grid', bg: 'bg-slate-900', pattern: 'linear-gradient(rgba(6,182,212,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.2) 1px, transparent 1px)', color: 'text-cyan-400' },
    { id: PresentationStyle.DarkDots, label: 'Dark Dots', bg: 'bg-zinc-900', pattern: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)', color: 'text-zinc-200' },
    { id: PresentationStyle.SoftGradient, label: 'Flow', bg: 'bg-indigo-900', pattern: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'text-pink-300' },
    { id: PresentationStyle.GeoPoly, label: 'Geometry', bg: 'bg-slate-800', pattern: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, transparent 2px, transparent 10px)', color: 'text-indigo-300' },
    { id: PresentationStyle.Minimalist, label: 'Clean White', bg: 'bg-slate-100', pattern: 'linear-gradient(#cbd5e1 1px, transparent 1px)', color: 'text-slate-800' },
];

const CreationStudio: React.FC<CreationStudioProps> = ({ onCreate, onOpenHistory, onCancelLoading, isLoading }) => {
  const [activeTab, setActiveTab] = useState<Tab>('HOME'); 
  const [loadingType, setLoadingType] = useState<'architect' | 'convert'>('architect');
  
  // Generator State
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<PresentationStyle>(PresentationStyle.NeonGrid);
  const [slideCount, setSlideCount] = useState(8);

  // Converter State (Home)
  const [fileContext, setFileContext] = useState('');
  const [fileName, setFileName] = useState('');

  // Community State
  const [communityDecks, setCommunityDecks] = useState<SharedPresentation[]>([]);
  const [userHistory, setUserHistory] = useState<Presentation[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setCommunityDecks(communityService.getDecks());
    setUserHistory(communityService.getHistory());
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileContext(`Presentation about: ${file.name}. (Simulated Content)`); 
    }
  };

  const handleCreateAction = (type: 'architect' | 'convert') => {
     setLoadingType(type);
     if (type === 'convert') {
        onCreate(fileName ? `Presentation derived from ${fileName}` : topic, style, fileContext, slideCount);
     } else {
        onCreate(topic, style, '', slideCount);
     }
  };

  // Upload Logic (Simplified for brevity as no changes requested here specifically)
  const handleUploadFromDevice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "application/json") {
        setUploading(true);
        try {
            const text = await file.text();
            const json: Presentation = JSON.parse(text);
            communityService.publishDeck(json, 'You (Device)');
            refreshData();
            setShowUploadModal(false);
            alert("Uploaded successfully!");
        } catch (err) { alert("Failed to upload."); } 
        finally { setUploading(false); }
    } else {
        if (confirm(`Convert "${file.name}" to Lakshya Deck?`)) {
            setShowUploadModal(false);
            setFileName(file.name);
            setFileContext(`Based on: ${file.name}`);
            setLoadingType('convert');
            onCreate(`Presentation based on ${file.name}`, style, `Based on ${file.name}`, 10);
        }
    }
    if(e.target) e.target.value = ''; 
  };

  const ThemeSelector = () => (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {THEMES.map(theme => (
              <button
                  key={theme.id}
                  onClick={() => setStyle(theme.id)}
                  className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all group ${style === theme.id ? 'border-sky-500 ring-2 ring-sky-500/30 scale-[1.02]' : 'border-slate-700 hover:border-slate-500'}`}
              >
                  <div className={`absolute inset-0 ${theme.bg}`} style={{ backgroundImage: theme.pattern, backgroundSize: theme.id === PresentationStyle.DarkDots ? '10px 10px' : '20px 20px' }}></div>
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                  <span className={`absolute bottom-2 left-2 text-xs font-bold ${theme.id === PresentationStyle.Minimalist ? 'text-slate-900 bg-white/80' : 'text-white bg-black/50'} px-2 py-1 rounded backdrop-blur-sm`}>
                      {theme.label}
                  </span>
                  {style === theme.id && (
                      <div className="absolute top-1 right-1 bg-sky-500 text-white rounded-full p-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                  )}
              </button>
          ))}
      </div>
  );

  const renderContent = () => {
    switch (activeTab) {
        case 'HOME': 
            return (
                <div className="w-full max-w-4xl animate-fade-in-up space-y-8">
                    <header className="text-center lg:text-left">
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">Transform Documents</h1>
                        <p className="text-slate-400 text-sm lg:text-lg">Convert PDF/PPT/Text to animated presentations.</p>
                    </header>
                    <GlassCard className="p-6 md:p-12 border-slate-700/50 bg-slate-900/40">
                         <div className="relative group mb-8">
                            <Label className="text-sky-400 mb-3">Upload Document</Label>
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-sky-500 transition-all">
                               <ImageIcon className="w-12 h-12 text-slate-500 mb-4" />
                               {fileName ? <p className="text-lg text-sky-400 font-bold">{fileName}</p> : <p className="text-slate-400">Click to Upload</p>}
                               <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.json,.pdf,.pptx" />
                            </label>
                         </div>
                         <div className="mb-8">
                             <Label>Select Theme</Label>
                             <ThemeSelector />
                         </div>
                         <Button onClick={() => handleCreateAction('convert')} disabled={isLoading || !fileName} className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-500">
                            Convert Now
                         </Button>
                    </GlassCard>
                </div>
            );

        case 'CREATE': 
            return (
                <div className="w-full max-w-4xl animate-fade-in-up">
                    <header className="mb-8 lg:mb-12 text-center lg:text-left">
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">Architect your Vision</h1>
                        <p className="text-slate-400 text-sm lg:text-lg">AI-powered cinematic deck generation.</p>
                    </header>
                    <GlassCard className="p-6 md:p-12 border-slate-700/50 bg-slate-900/40">
                         <div className="mb-8">
                            <Label className="text-sky-400 mb-3">Topic</Label>
                            <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. A pitch deck for a new AI startup..." className="h-32 text-lg bg-black/20" />
                         </div>
                         <div className="mb-8">
                            <Label className="text-slate-400 mb-3">Select Visual Theme</Label>
                            <ThemeSelector />
                         </div>
                         <div className="mb-8">
                             <Label className="text-slate-400">Length: {slideCount} Slides</Label>
                             <input type="range" min="3" max="12" value={slideCount} onChange={(e) => setSlideCount(parseInt(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 mt-4" />
                         </div>
                         <Button onClick={() => handleCreateAction('architect')} disabled={isLoading || !topic} className="w-full h-12 text-lg bg-sky-600 hover:bg-sky-500">
                            Generate
                         </Button>
                    </GlassCard>
                </div>
            );

        case 'COMMUNITY':
            return (
                <div className="w-full max-w-5xl animate-fade-in-up">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-white">Community Hub</h1>
                        <button onClick={() => setShowUploadModal(true)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white text-sm font-bold flex gap-2"><UploadIcon className="w-4 h-4"/> Upload</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communityDecks.map((deck) => (
                            <GlassCard key={deck.id} className="p-0 overflow-hidden group hover:border-sky-500/50 relative">
                                <div className={`h-32 w-full ${deck.style === PresentationStyle.Minimalist ? 'bg-slate-200' : 'bg-slate-800'}`}>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                         {/* Mini Preview of theme */}
                                         <div className={`w-full h-full ${deck.style === PresentationStyle.DarkDots ? 'bg-[radial-gradient(circle,#fff_1px,transparent_1px)] bg-[length:10px_10px]' : ''}`}></div>
                                    </div>
                                    <div className="absolute bottom-3 left-4 right-4">
                                        <h3 className={`font-bold truncate ${deck.style === PresentationStyle.Minimalist ? 'text-slate-900' : 'text-white'}`}>{deck.title}</h3>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-900/80 flex gap-2">
                                     <button className="flex-1 py-2 rounded bg-white/5 text-xs font-bold text-slate-300">♥ {deck.likes}</button>
                                     <button className="flex-1 py-2 rounded bg-sky-600/20 text-xs font-bold text-sky-400">Save</button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                     {/* UPLOAD MODAL */}
                     {showUploadModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <GlassCard className="max-w-md w-full p-6 border-sky-500/30">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">Upload</h3>
                                    <button onClick={() => setShowUploadModal(false)}><XIcon className="w-6 h-6"/></button>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                                    <label className="cursor-pointer flex items-center gap-4 w-full">
                                        <UploadIcon className="w-8 h-8 text-sky-400"/>
                                        <div><h4 className="text-white font-bold">From Device</h4><p className="text-xs text-slate-400">PDF, PPTX, JSON</p></div>
                                        <input type="file" className="hidden" accept=".json,.pdf,.pptx" onChange={handleUploadFromDevice} disabled={uploading} />
                                    </label>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </div>
            );
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col lg:flex-row overflow-hidden font-sans">
      {isLoading && (
          <div className="fixed inset-0 z-[100]">
            <LoadingOverlay type={loadingType} />
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-[101]">
                <button onClick={onCancelLoading} className="px-6 py-2 bg-white/10 rounded-full text-white backdrop-blur-md">Cancel</button>
            </div>
          </div>
      )}
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 h-full border-r border-white/5 bg-slate-900/50 backdrop-blur-xl flex-col py-8 z-10 shrink-0">
         <div className="px-6 mb-12 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center"><span className="text-white font-black text-xl">L</span></div>
            <span className="font-black text-lg text-white">Lakshya Studio</span>
         </div>
         <nav className="flex-col px-4 space-y-2 flex">
            <button onClick={() => setActiveTab('HOME')} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'HOME' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:text-white'}`}>
                <span className="font-bold">Home</span>
            </button>
            <button onClick={() => setActiveTab('CREATE')} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'CREATE' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:text-white'}`}>
                <span className="font-bold">Create</span>
            </button>
            <button onClick={() => setActiveTab('COMMUNITY')} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'COMMUNITY' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:text-white'}`}>
                <span className="font-bold">Community</span>
            </button>
         </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 p-4 lg:p-12 flex flex-col items-center pb-24 lg:pb-12">
         {/* Mobile Header */}
         <div className="lg:hidden w-full flex justify-between mb-6">
             <span className="font-black text-lg text-white">Lakshya Studio</span>
             <span className="text-xs font-bold text-sky-500">BETA</span>
         </div>
         {renderContent()}
      </main>

      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 border-t border-white/10 flex justify-around items-center z-50">
         <button onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center ${activeTab === 'HOME' ? 'text-sky-400' : 'text-slate-500'}`}><span className="text-xs font-bold">Home</span></button>
         <button onClick={() => setActiveTab('CREATE')} className="w-12 h-12 bg-sky-600 rounded-full flex items-center justify-center -mt-6 shadow-lg text-white text-2xl pb-1">+</button>
         <button onClick={() => setActiveTab('COMMUNITY')} className={`flex flex-col items-center ${activeTab === 'COMMUNITY' ? 'text-sky-400' : 'text-slate-500'}`}><span className="text-xs font-bold">Community</span></button>
      </div>
    </div>
  );
};

export default CreationStudio;
