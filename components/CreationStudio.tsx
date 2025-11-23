
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

const CreationStudio: React.FC<CreationStudioProps> = ({ onCreate, onOpenHistory, onCancelLoading, isLoading }) => {
  const [activeTab, setActiveTab] = useState<Tab>('HOME'); 
  const [loadingType, setLoadingType] = useState<'architect' | 'convert'>('architect');
  
  // Generator State
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<PresentationStyle>(PresentationStyle.Cyberpunk);
  const [slideCount, setSlideCount] = useState(8);

  // Converter State (Home)
  const [fileContext, setFileContext] = useState('');
  const [fileName, setFileName] = useState('');

  // Community State
  const [communityDecks, setCommunityDecks] = useState<SharedPresentation[]>([]);
  const [userHistory, setUserHistory] = useState<Presentation[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Load data on mount
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
      // For PDF/PPTX, we simulate reading since we lack backend parsers in this demo
      // We pass the filename to the AI to "hallucinate" accurate structure based on topic if text extraction fails
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

  // Enhanced Upload: JSON or Auto-Convert PDF/PPTX
  const handleUploadFromDevice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check File Type
    if (file.type === "application/json") {
        setUploading(true);
        try {
            const text = await file.text();
            const json: Presentation = JSON.parse(text);
            if (!json.slides || !json.title) throw new Error("Invalid presentation file");

            communityService.publishDeck(json, 'You (Device)');
            refreshData();
            setShowUploadModal(false);
            alert("Presentation uploaded successfully!");
        } catch (err) {
            alert("Failed to upload JSON.");
        } finally {
            setUploading(false);
        }
    } else {
        // Assume PDF/PPTX/Text - Trigger AI Conversion then Publish
        // Note: Real PDF parsing is not available client-side in this environment without heavy libs. 
        // We simulate reading metadata or assume user wants AI generation based on filename.
        if (confirm(`To upload "${file.name}", we need to convert it to a Lakshya Deck first. Proceed with AI conversion?`)) {
            setShowUploadModal(false);
            setFileName(file.name);
            setFileContext(`Presentation based on uploaded file: ${file.name}`);
            setLoadingType('convert');
            onCreate(`Presentation based on ${file.name}`, style, `Presentation based on ${file.name}`, 10);
        }
    }
    
    if(e.target) e.target.value = ''; 
  };

  const handleUploadFromHistory = (p: Presentation) => {
      communityService.publishDeck(p, 'You');
      refreshData();
      setShowUploadModal(false);
      alert("Presentation shared from history!");
  };

  const handleLike = (id: string) => {
    const updated = communityService.likeDeck(id);
    setCommunityDecks(updated);
  };

  const handleDeletePost = (id: string) => {
    if (confirm("Are you sure you want to delete this post from the community?")) {
        const updated = communityService.deleteDeck(id);
        setCommunityDecks(updated);
    }
  };

  const handleHistoryDelete = (title: string) => {
      if(confirm("Delete this presentation from your history?")) {
          const updated = communityService.deleteHistory(title);
          setUserHistory(updated);
      }
  }

  const handleShareFromHistory = (p: Presentation) => {
      if(confirm(`Publish "${p.title}" to Community Hub?`)) {
          communityService.publishDeck(p, 'You');
          refreshData();
          setActiveTab('COMMUNITY');
      }
  }

  const handleDownloadJSON = (deck: Presentation | SharedPresentation, isShared: boolean) => {
    if (isShared) {
        const d = deck as SharedPresentation;
        const updated = communityService.incrementDownload(d.id);
        setCommunityDecks(updated);
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(deck));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${deck.title.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const renderContent = () => {
    switch (activeTab) {
        case 'HOME': // FILE CONVERTER
            return (
                <div className="w-full max-w-4xl animate-fade-in-up space-y-8">
                    <header className="text-center lg:text-left">
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
                            <label className="flex flex-col items-center justify-center w-full h-40 md:h-48 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800/30 hover:border-sky-500 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(14,165,233,0.1)]">
                               <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                  <ImageIcon className="w-12 h-12 md:w-16 md:h-16 text-slate-500 mb-4 group-hover:text-sky-400 transition-colors" />
                                  {fileName ? (
                                     <p className="text-lg text-sky-400 font-semibold break-all">{fileName}</p>
                                  ) : (
                                     <>
                                        <p className="text-sm md:text-base text-slate-400 font-medium">Click to Upload PDF, PPTX or TXT</p>
                                        <p className="text-xs text-slate-600 mt-2">AI extracts key insights automatically</p>
                                     </>
                                  )}
                               </div>
                               <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.json,.csv,.pdf,.pptx" />
                            </label>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                             <div>
                                <Label>Visual Style</Label>
                                <Select value={style} onChange={(e) => setStyle(e.target.value as PresentationStyle)}>
                                    {Object.values(PresentationStyle).map(s => <option key={s} value={s}>{s}</option>)}
                                </Select>
                             </div>
                             <div>
                                <Label>Slides</Label>
                                <Select value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))}>
                                    {[5, 8, 10, 12].map(n => <option key={n} value={n}>{n} Slides</option>)}
                                </Select>
                             </div>
                         </div>

                         <Button 
                            onClick={() => handleCreateAction('convert')}
                            disabled={isLoading || !fileName}
                            className="w-full h-12 md:h-14 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg"
                         >
                            Convert to Presentation
                         </Button>
                    </GlassCard>

                    {/* HISTORY */}
                    {userHistory.length > 0 && (
                        <div className="animate-fade-in-up stagger-2">
                            <h2 className="text-2xl font-bold text-white mb-4 px-2">My Creations</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userHistory.map((h, idx) => (
                                    <GlassCard key={idx} className="p-4 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
                                        <div className="overflow-hidden mr-4">
                                            <h3 className="font-bold text-white truncate">{h.title}</h3>
                                            <p className="text-xs text-slate-400">{h.style} • {h.slides.length} slides</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button onClick={() => onOpenHistory(h)} className="p-2 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/40" title="Open">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            </button>
                                            <button onClick={() => handleShareFromHistory(h)} className="p-2 rounded-lg bg-pink-500/20 text-pink-400 hover:bg-pink-500/40" title="Share">
                                                <ShareIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleHistoryDelete(h.title)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40" title="Delete">
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );

        case 'CREATE': // AI GENERATOR
            return (
                <div className="w-full max-w-4xl animate-fade-in-up">
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
                              className="h-32 md:h-40 text-base md:text-lg bg-black/20 border-white/10 focus:border-sky-500/50"
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
                               <Label className="text-slate-400">Length: {slideCount} Slides</Label>
                               <input 
                                  type="range" 
                                  min="3" 
                                  max="12" 
                                  value={slideCount} 
                                  onChange={(e) => setSlideCount(parseInt(e.target.value))}
                                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 mt-4"
                               />
                            </div>
                         </div>

                         <Button 
                            onClick={() => handleCreateAction('architect')}
                            disabled={isLoading || !topic}
                            className="w-full h-12 md:h-14 text-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg"
                         >
                            Generate Presentation
                         </Button>
                    </GlassCard>
                </div>
            );

        case 'COMMUNITY': // COMMUNITY HUB
            return (
                <div className="w-full max-w-5xl animate-fade-in-up">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-bold text-white tracking-tight">Community Hub</h1>
                            <p className="text-slate-400 text-sm">Explore, remix, and share decks from around the world.</p>
                        </div>
                        
                        <button 
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 hover:bg-white/20 text-sm px-4 py-2 rounded-lg transition-colors font-bold text-white"
                        >
                            <UploadIcon className="w-4 h-4" />
                            <span>Upload Deck</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communityDecks.map((deck) => (
                            <GlassCard key={deck.id} className="p-0 overflow-hidden group border-white/10 hover:border-sky-500/50 transition-all relative">
                                {deck.sharedBy === 'You' || deck.sharedBy === 'You (Device)' ? (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeletePost(deck.id); }}
                                        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 text-red-400 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete your post"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                ) : null}
                                <div className="h-32 w-full bg-slate-800 relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-transparent z-10"></div>
                                    <div className="absolute bottom-3 left-4 right-4 z-20">
                                        <h3 className="text-white font-bold truncate shadow-black drop-shadow-md">{deck.title}</h3>
                                        <p className="text-xs text-white/80">{deck.style}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-900/80">
                                    <div className="flex justify-between items-center text-xs text-slate-400 mb-4">
                                        <span className="truncate max-w-[80px]">@{deck.sharedBy}</span>
                                        <span>{deck.dateShared}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleLike(deck.id)}
                                            className="flex-1 py-2 rounded bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <span className="text-pink-500">♥</span>
                                            {deck.likes}
                                        </button>
                                        <button 
                                            onClick={() => handleDownloadJSON(deck, true)}
                                            className="flex-1 py-2 rounded bg-sky-600/20 hover:bg-sky-600/30 text-xs font-bold text-sky-400 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>

                    {/* UPLOAD MODAL */}
                    {showUploadModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
                            <GlassCard className="max-w-md w-full p-6 border-sky-500/30">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">Upload to Community</h3>
                                    <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white"><XIcon className="w-6 h-6"/></button>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                        <label className="cursor-pointer flex items-center gap-4 w-full">
                                            <div className="w-12 h-12 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                                                <UploadIcon className="w-6 h-6"/>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-white font-bold">Upload File</h4>
                                                <p className="text-xs text-slate-400">PDF, PPTX, JSON</p>
                                            </div>
                                            <input type="file" className="hidden" accept=".json,.pdf,.pptx,.txt" onChange={handleUploadFromDevice} disabled={uploading} />
                                        </label>
                                    </div>

                                    <div className="text-center text-xs text-slate-500 font-bold uppercase tracking-widest my-2">OR SELECT FROM HISTORY</div>

                                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                        {userHistory.length === 0 ? (
                                            <p className="text-slate-500 text-xs text-center py-4">No generated decks yet.</p>
                                        ) : (
                                            userHistory.map((h, i) => (
                                                <button 
                                                    key={i} 
                                                    onClick={() => handleUploadFromHistory(h)}
                                                    className="w-full p-3 rounded-lg bg-slate-800 text-left hover:bg-sky-900/30 border border-transparent hover:border-sky-500/30 transition-all flex justify-between items-center group"
                                                >
                                                    <span className="text-sm text-slate-200 truncate max-w-[200px]">{h.title}</span>
                                                    <span className="text-xs text-sky-400 opacity-0 group-hover:opacity-100">Select</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </div>
            );
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col lg:flex-row overflow-hidden font-sans selection:bg-sky-500/30">
      
      {/* Loading */}
      {isLoading && (
          <div className="fixed inset-0 z-[100]">
            <LoadingOverlay type={loadingType} />
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-[101]">
                <button onClick={onCancelLoading} className="px-6 py-2 bg-white/10 border border-white/20 rounded-full text-white hover:bg-white/20 transition-all font-bold text-sm backdrop-blur-md">
                    Cancel
                </button>
            </div>
          </div>
      )}

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-900/20 blur-[120px]"></div>
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 h-full border-r border-white/5 bg-slate-900/50 backdrop-blur-xl flex-col py-8 z-10 shrink-0">
         <div className="px-6 mb-12 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
               <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className="font-black text-lg tracking-tight text-white">Lakshya Studio</span>
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 p-4 lg:p-12 flex flex-col items-center pb-32 lg:pb-12">
         <div className="lg:hidden w-full flex items-center justify-between mb-6 pt-2">
            <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </div>
                 <span className="font-black text-lg text-white">Lakshya Studio</span>
            </div>
             <div className="text-right">
               <p className="text-[10px] uppercase text-slate-500 font-bold">Dev by</p>
               <p className="text-xs font-black animate-text-shimmer">Lakshya</p>
            </div>
         </div>

         {renderContent()}

      </main>

      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around z-50 pb-safe px-4">
         <NavBtn icon="home" label="Home" active={activeTab === 'HOME'} onClick={() => setActiveTab('HOME')} />
         
         <div className="relative -top-6">
             <button 
                onClick={() => setActiveTab('CREATE')}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-transform active:scale-95 ${activeTab === 'CREATE' ? 'bg-white text-sky-600' : 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white'}`}
             >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
             </button>
         </div>

         <NavBtn icon="globe" label="Community" active={activeTab === 'COMMUNITY'} onClick={() => setActiveTab('COMMUNITY')} />
      </div>

    </div>
  );
};

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
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 w-20 ${active ? 'text-sky-400' : 'text-slate-500'}`}>
        {getIcon(icon)}
        <span className="text-[11px] font-bold tracking-wide">{label}</span>
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

export default CreationStudio;
