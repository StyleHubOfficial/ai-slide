
import React, { useState, useEffect } from 'react';
import { PresentationStyle, SharedPresentation, Presentation } from '../types';
import { communityService } from '../services/communityService';
import { generatePresentation } from '../services/geminiService';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import Label from './ui/Label';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import ImageIcon from './icons/ImageIcon';
import UploadIcon from './icons/UploadIcon';
import ShareIcon from './icons/ShareIcon';
import XIcon from './icons/XIcon';
import HomeIcon from './icons/HomeIcon';
import CommunityIcon from './icons/CommunityIcon';
import CreateIcon from './icons/CreateIcon';
import DownloadIcon from './icons/DownloadIcon';
import RobotIcon from './icons/RobotIcon';
import HelpIcon from './icons/HelpIcon';
import ChatInterface from './ChatInterface';
import LoadingOverlay from './ui/LoadingOverlay';
import TourGuide, { TourStep } from './ui/TourGuide';

interface CreationStudioProps {
  onCreate: (topic: string, style: PresentationStyle, fileContext: string, slideCount: number) => void;
  onOpenHistory: (presentation: Presentation) => void;
  onCancelLoading: () => void;
  isLoading: boolean;
}

type Tab = 'HOME' | 'CREATE' | 'COMMUNITY' | 'CHAT';

// NEW STUDY THEMES
const THEMES = [
    { id: PresentationStyle.Blackboard, label: 'Blackboard', bg: 'bg-[#1a2e1a]', pattern: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', color: 'text-white' },
    { id: PresentationStyle.Whiteboard, label: 'Whiteboard', bg: 'bg-white', pattern: 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)', color: 'text-slate-800' },
    { id: PresentationStyle.Notebook, label: 'Notebook', bg: 'bg-[#fdfbf7]', pattern: 'linear-gradient(#e5e7eb 1px, transparent 1px)', color: 'text-slate-700' },
    { id: PresentationStyle.Blueprint, label: 'Blueprint', bg: 'bg-[#1e3a8a]', pattern: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', color: 'text-blue-100' },
    { id: PresentationStyle.DigitalPad, label: 'Digital Pad', bg: 'bg-slate-900', pattern: 'linear-gradient(rgba(56,189,248,0.1) 1px, transparent 1px)', color: 'text-sky-400' },
];

const CreationStudio: React.FC<CreationStudioProps> = ({ onCreate, onOpenHistory, onCancelLoading, isLoading }) => {
  const [activeTab, setActiveTab] = useState<Tab>('HOME'); 
  const [loadingType, setLoadingType] = useState<'architect' | 'convert'>('architect');
  
  // Generator State
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<PresentationStyle>(PresentationStyle.Blackboard);
  const [slideCount, setSlideCount] = useState(7);

  // Converter State (Home)
  const [fileContext, setFileContext] = useState('');
  const [fileName, setFileName] = useState('');

  // Community State
  const [communityDecks, setCommunityDecks] = useState<SharedPresentation[]>([]);
  const [userHistory, setUserHistory] = useState<Presentation[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  // Tour State
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);

  useEffect(() => {
    refreshData();
    
    // Real-time updates from other tabs
    const handleStorageChange = () => refreshData();
    window.addEventListener('storage', handleStorageChange);
    
    // Check if user has seen tour
    const hasSeenTour = localStorage.getItem('lakshya_has_seen_tour');
    if (!hasSeenTour) {
        // Short delay to ensure rendering
        setTimeout(() => handleStartTour(), 1000);
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const refreshData = () => {
    setCommunityDecks(communityService.getDecks());
    setUserHistory(communityService.getHistory());
  };

  const handleStartTour = () => {
      // Determine if mobile or desktop to set correct targets
      const isMobile = window.innerWidth < 1024;
      const steps: TourStep[] = [
          {
              targetId: 'center',
              title: 'Welcome to Lakshya Study Studio',
              content: 'Let\'s take a quick tour. We transform boring documents into beautiful, hand-drawn style study guides and lecture notes.'
          },
          {
              targetId: isMobile ? 'nav-home-mob' : 'nav-home-desk',
              title: 'Document Converter',
              content: 'Upload PDFs or notes here. The AI will summarize and convert them into a visual blackboard lecture for you.'
          },
          {
              targetId: isMobile ? 'nav-chat-mob' : 'nav-chat-desk',
              title: 'AI Tutor',
              content: 'Chat with the Professor AI to ask specific questions or brainstorm essay topics.'
          },
          {
              targetId: isMobile ? 'nav-create-mob' : 'nav-create-desk',
              title: 'Concept Builder',
              content: 'Create a study guide from scratch. Just enter a topic (e.g., "Photosynthesis") and choose a visual style like Blackboard or Blueprint.'
          },
          {
              targetId: isMobile ? 'nav-comm-mob' : 'nav-comm-desk',
              title: 'Study Group',
              content: 'Explore study guides shared by other students in the community.'
          }
      ];
      setTourSteps(steps);
      setRunTour(true);
      setActiveTab('HOME'); // Ensure we start on a known tab
  };

  const handleTourComplete = () => {
      setRunTour(false);
      localStorage.setItem('lakshya_has_seen_tour', 'true');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileContext(`Study Material: ${file.name}. (Simulated Content)`); 
    }
  };

  const handleCreateAction = (type: 'architect' | 'convert') => {
     setLoadingType(type);
     if (type === 'convert') {
        onCreate(fileName ? `Study Guide: ${fileName}` : topic, style, fileContext, slideCount);
     } else {
        onCreate(topic, style, '', slideCount);
     }
  };

  const handleUploadFromDevice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/json") {
        setUploading(true);
        try {
            const text = await file.text();
            const json: Presentation = JSON.parse(text);
            communityService.publishDeck(json, 'You (Imported)');
            refreshData();
            setShowUploadModal(false);
            alert("Published to Community Successfully!");
        } catch (err) { alert("Invalid JSON file."); } 
        finally { setUploading(false); }
    } else {
        // Handle PDF/PPTX -> Convert -> Publish
        if (confirm(`Convert and Publish "${file.name}" to Community?`)) {
            setShowUploadModal(false);
            setInternalLoading(true);
            setLoadingType('convert');
            try {
                // Simulate context
                const context = `Presentation based on uploaded file: ${file.name}`;
                const pres = await generatePresentation({
                    topic: `Analysis of ${file.name}`,
                    style: PresentationStyle.Blackboard,
                    fileContext: context,
                    slideCount: 7
                });
                communityService.publishDeck(pres, 'You (Converted)');
                communityService.saveHistory(pres);
                refreshData();
                alert("File converted and published to Community Hub!");
            } catch (err) {
                alert("Conversion failed.");
            } finally {
                setInternalLoading(false);
            }
        }
    }
    if(e.target) e.target.value = ''; 
  };

  const handlePublishFromHistory = (p: Presentation) => {
      if(confirm(`Publish "${p.title}" to Public Community?`)) {
          communityService.publishDeck(p, 'You');
          refreshData();
          setShowUploadModal(false);
          setActiveTab('COMMUNITY');
      }
  };

  const handleDeleteHistory = (e: React.MouseEvent, title: string) => {
      e.stopPropagation();
      if(confirm("Delete this deck from your history?")) {
          communityService.deleteHistory(title);
          refreshData();
      }
  };

  const handleDeleteCommunity = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm("Delete this post from community?")) {
          communityService.deleteDeck(id);
          refreshData();
      }
  };

  const handleDownloadDeck = (e: React.MouseEvent, deck: SharedPresentation) => {
      e.stopPropagation();
      communityService.incrementDownload(deck.id);
      communityService.downloadDeck(deck);
      refreshData();
  };

  const ThemeSelector = () => (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {THEMES.map(theme => (
              <button
                  key={theme.id}
                  onClick={() => setStyle(theme.id)}
                  className={`relative h-24 rounded-lg overflow-hidden border-2 transition-all group ${style === theme.id ? 'border-sky-500 ring-2 ring-sky-500/30 scale-[1.02]' : 'border-slate-700 hover:border-slate-500'}`}
              >
                  <div className={`absolute inset-0 ${theme.bg}`} style={{ backgroundImage: theme.pattern, backgroundSize: theme.id === PresentationStyle.Notebook ? '100% 20px' : '20px 20px' }}></div>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                  
                  {/* Style Preview Elements */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className={`text-lg font-bold ${theme.color} ${theme.id === PresentationStyle.Blackboard ? 'font-chalk' : theme.id === PresentationStyle.Whiteboard ? 'font-marker' : theme.id === PresentationStyle.Notebook ? 'font-hand' : 'font-sans'}`}>
                         Aa
                      </span>
                  </div>

                  <span className={`absolute bottom-2 left-2 text-xs font-bold ${theme.id === PresentationStyle.Whiteboard || theme.id === PresentationStyle.Notebook ? 'text-slate-900 bg-white/80' : 'text-white bg-black/50'} px-2 py-1 rounded backdrop-blur-sm`}>
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
        case 'CHAT':
            return <ChatInterface />;

        case 'HOME': 
            return (
                <div className="w-full max-w-4xl animate-fade-in-up space-y-8">
                    <header className="text-center lg:text-left">
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">Convert Notes to Lectures</h1>
                        <p className="text-slate-400 text-sm lg:text-lg">Upload study materials (PDF/Text) and get a visual blackboard summary.</p>
                    </header>
                    <GlassCard className="p-6 md:p-12 border-slate-700/50 bg-slate-900/40">
                         <div className="relative group mb-8">
                            <Label className="text-sky-400 mb-3">Upload Study Material</Label>
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-sky-500 transition-all">
                               <ImageIcon className="w-12 h-12 text-slate-500 mb-4" />
                               {fileName ? <p className="text-lg text-sky-400 font-bold">{fileName}</p> : <p className="text-slate-400">Click to Upload (PDF, TXT)</p>}
                               <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.json,.pdf,.pptx" />
                            </label>
                         </div>
                         <div className="mb-8">
                             <Label>Select Teaching Style</Label>
                             <ThemeSelector />
                         </div>
                         <Button onClick={() => handleCreateAction('convert')} disabled={isLoading || !fileName} className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-500">
                            Generate Lecture
                         </Button>
                    </GlassCard>

                    {/* HISTORY SECTION */}
                    <div className="mt-12">
                         <h2 className="text-2xl font-bold text-white mb-6">My Study Guides</h2>
                         {userHistory.length === 0 ? (
                             <div className="text-slate-500 text-center py-8 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">No history yet.</div>
                         ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {userHistory.map(h => (
                                     <div key={h.title + Math.random()} onClick={() => onOpenHistory(h)} className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 cursor-pointer group flex justify-between items-center transition-all">
                                         <div>
                                            <h4 className="font-bold text-slate-200 group-hover:text-sky-400 transition-colors">{h.title}</h4>
                                            <p className="text-xs text-slate-500">{h.slides.length} Boards • {h.style}</p>
                                         </div>
                                         <div className="flex gap-2">
                                             <button onClick={(e) => handleDeleteHistory(e, h.title)} className="p-2 hover:bg-red-500/20 text-slate-600 hover:text-red-400 rounded-lg transition-colors"><XIcon className="w-4 h-4"/></button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                    </div>
                </div>
            );

        case 'CREATE': 
            return (
                <div className="w-full max-w-4xl animate-fade-in-up">
                    <header className="mb-8 lg:mb-12 text-center lg:text-left">
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">Concept Builder</h1>
                        <p className="text-slate-400 text-sm lg:text-lg">AI-powered study guide generation from any topic.</p>
                    </header>
                    <GlassCard className="p-6 md:p-12 border-slate-700/50 bg-slate-900/40">
                         <div className="mb-8">
                            <Label className="text-sky-400 mb-3">Topic / Question</Label>
                            <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Explain Quantum Entanglement like I'm 5..." className="h-32 text-lg bg-black/20" />
                         </div>
                         <div className="mb-8">
                            <Label className="text-slate-400 mb-3">Visual Style</Label>
                            <ThemeSelector />
                         </div>
                         <div className="mb-8">
                             <Label className="text-slate-400">Length: {slideCount} Boards</Label>
                             <input type="range" min="3" max="12" value={slideCount} onChange={(e) => setSlideCount(parseInt(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 mt-4" />
                         </div>
                         <Button onClick={() => handleCreateAction('architect')} disabled={isLoading || !topic} className="w-full h-12 text-lg bg-sky-600 hover:bg-sky-500">
                            Generate Concepts
                         </Button>
                    </GlassCard>
                </div>
            );

        case 'COMMUNITY':
            return (
                <div className="w-full max-w-5xl animate-fade-in-up">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-white">Study Group Hub</h1>
                        <button onClick={() => setShowUploadModal(true)} className="bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded-lg text-white text-sm font-bold flex gap-2 shadow-lg shadow-sky-500/20"><UploadIcon className="w-4 h-4"/> Share Notes</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communityDecks.map((deck) => (
                            <GlassCard key={deck.id} className="p-0 overflow-hidden group hover:border-sky-500/50 relative">
                                <div className={`h-36 w-full ${deck.style === PresentationStyle.Whiteboard ? 'bg-slate-200' : 'bg-slate-800'} relative`}>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                         {/* Simple Preview Pattern */}
                                         <div className="w-full h-full bg-slate-900 opacity-20"></div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                    <div className="absolute bottom-3 left-4 right-4 z-10">
                                        <h3 className={`font-bold truncate text-white text-lg`}>{deck.title}</h3>
                                        <p className="text-xs text-slate-300">by {deck.sharedBy}</p>
                                    </div>
                                    <button onClick={(e) => handleDeleteCommunity(e, deck.id)} className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-red-500/80 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"><XIcon className="w-3 h-3"/></button>
                                </div>
                                <div className="p-4 bg-slate-900/90 flex gap-2">
                                     <div className="flex-1 py-2 rounded bg-white/5 flex items-center justify-center gap-1 text-xs font-bold text-slate-300">
                                        <span className="text-pink-500">♥</span> {deck.likes}
                                     </div>
                                     <button onClick={() => onOpenHistory(deck)} className="flex-1 py-2 rounded bg-sky-600/20 hover:bg-sky-600/30 text-xs font-bold text-sky-400 transition-colors">Study</button>
                                     <button onClick={(e) => handleDownloadDeck(e, deck)} className="py-2 px-3 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 transition-colors" title="Download JSON">
                                        <DownloadIcon className="w-4 h-4" />
                                     </button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                     {/* UPLOAD MODAL */}
                     {showUploadModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <GlassCard className="max-w-md w-full p-6 border-sky-500/30 relative">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">Share Notes</h3>
                                    <button onClick={() => setShowUploadModal(false)}><XIcon className="w-6 h-6"/></button>
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Option 1: Upload File */}
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500 transition-colors">
                                        <label className="cursor-pointer flex items-center gap-4 w-full">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><UploadIcon className="w-5 h-5"/></div>
                                            <div><h4 className="text-white font-bold">Upload File</h4><p className="text-xs text-slate-400">PDF, PPTX (Auto-Convert)</p></div>
                                            <input type="file" className="hidden" accept=".json,.pdf,.pptx" onChange={handleUploadFromDevice} disabled={uploading || internalLoading} />
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-4 py-2">
                                        <div className="h-px bg-white/10 flex-1"></div>
                                        <span className="text-xs text-slate-500 font-bold">OR SELECT FROM HISTORY</span>
                                        <div className="h-px bg-white/10 flex-1"></div>
                                    </div>

                                    {/* Option 2: Select from History */}
                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {userHistory.map(h => (
                                            <button key={h.title + Math.random()} onClick={() => handlePublishFromHistory(h)} className="w-full text-left p-3 rounded-lg bg-black/20 hover:bg-sky-500/20 border border-white/5 hover:border-sky-500/50 flex justify-between items-center group">
                                                <span className="text-sm font-bold text-slate-300 group-hover:text-white truncate max-w-[180px]">{h.title}</span>
                                                <span className="text-[10px] text-slate-500">Publish</span>
                                            </button>
                                        ))}
                                        {userHistory.length === 0 && <p className="text-center text-xs text-slate-500 py-2">No decks in history.</p>}
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </div>
            );
    }
  };

  const isMobileChat = activeTab === 'CHAT';

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col lg:flex-row overflow-hidden font-sans">
      <TourGuide steps={tourSteps} isOpen={runTour} onClose={() => setRunTour(false)} onComplete={handleTourComplete} />

      {(isLoading || internalLoading) && (
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0"><span className="text-white font-black text-xl">L</span></div>
            <span className="font-black text-lg text-white animate-text-shimmer">Lakshya Studio</span>
         </div>
         <nav className="flex-col px-4 space-y-2 flex flex-1">
            <button id="nav-home-desk" onClick={() => setActiveTab('HOME')} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'HOME' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:text-white'}`}>
                <HomeIcon className="w-5 h-5"/>
                <span className="font-bold">Home</span>
            </button>
            <button id="nav-chat-desk" onClick={() => setActiveTab('CHAT')} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'CHAT' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:text-white'}`}>
                <RobotIcon className="w-5 h-5"/>
                <span className="font-bold">AI Tutor</span>
            </button>
            <button id="nav-create-desk" onClick={() => setActiveTab('CREATE')} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'CREATE' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:text-white'}`}>
                <CreateIcon className="w-5 h-5"/>
                <span className="font-bold">Create</span>
            </button>
            <button id="nav-comm-desk" onClick={() => setActiveTab('COMMUNITY')} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'COMMUNITY' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:text-white'}`}>
                <CommunityIcon className="w-5 h-5"/>
                <span className="font-bold">Community</span>
            </button>
         </nav>
         
         {/* Sidebar Footer with Help Button */}
         <div className="px-4 mt-auto">
             <button onClick={handleStartTour} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                 <HelpIcon className="w-5 h-5" />
                 <span className="font-bold">Help & Tour</span>
             </button>
         </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`${isMobileChat ? 'flex-1 relative z-10 flex flex-col h-full overflow-hidden lg:pb-0' : 'flex-1 overflow-y-auto relative z-10 p-4 lg:p-12 flex flex-col items-center pb-24 lg:pb-12'}`}
        style={isMobileChat ? { paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' } : {}}
      >
         {/* Mobile Header - Hide only for Chat to give full screen feel */}
         {activeTab !== 'CHAT' && (
             <div className="lg:hidden w-full flex justify-between mb-6">
                 <span className="font-black text-lg text-white animate-text-shimmer">Lakshya Studio</span>
                 <span className="text-xs font-bold text-sky-500">BETA</span>
             </div>
         )}
         {renderContent()}
      </main>

      {/* Mobile Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 border-t border-white/10 grid grid-cols-4 items-center z-50 pb-safe">
         <button id="nav-home-mob" onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center gap-1 ${activeTab === 'HOME' ? 'text-sky-400' : 'text-slate-500'}`}>
            <HomeIcon className="w-6 h-6"/>
            <span className="text-[10px] font-bold">Home</span>
         </button>
         
         <button id="nav-chat-mob" onClick={() => setActiveTab('CHAT')} className={`flex flex-col items-center gap-1 ${activeTab === 'CHAT' ? 'text-sky-400' : 'text-slate-500'}`}>
            <RobotIcon className="w-6 h-6"/>
            <span className="text-[10px] font-bold">Tutor</span>
         </button>

         <button id="nav-create-mob" onClick={() => setActiveTab('CREATE')} className={`flex flex-col items-center gap-1 ${activeTab === 'CREATE' ? 'text-sky-400' : 'text-slate-500'}`}>
            <CreateIcon className="w-6 h-6"/>
            <span className="text-[10px] font-bold">Create</span>
         </button>

         <button id="nav-comm-mob" onClick={() => setActiveTab('COMMUNITY')} className={`flex flex-col items-center gap-1 ${activeTab === 'COMMUNITY' ? 'text-sky-400' : 'text-slate-500'}`}>
            <CommunityIcon className="w-6 h-6"/>
            <span className="text-[10px] font-bold">Groups</span>
         </button>
      </div>
    </div>
  );
};

export default CreationStudio;
