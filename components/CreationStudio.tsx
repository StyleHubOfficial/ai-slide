
import React, { useState, useEffect } from 'react';
import { PresentationStyle, SharedPresentation, Presentation } from '../types';
import { communityService } from '../services/communityService';
import { generatePresentation } from '../services/geminiService';
import { uploadContent, subscribeToContent, toggleVisibility, deleteContent, ContentItem } from '../services/firebaseService';
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

const getRenderType = (type: string, url: string) => {
    const lowerUrl = (url || '').toLowerCase();
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.match(/\.(mp4|webm|ogg|m3u8|mov)$/i)) return 'video';
    if (lowerUrl.match(/\.(mp3|wav|ogg|m4a)$/i)) return 'audio';
    if (lowerUrl.match(/\.(pdf)$/i)) return 'pdf';
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    return type; // fallback to stored type
};

const renderYoutube = (url: string) => {
    let videoId = '';
    if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
    else if (url.includes('watch?v=')) videoId = url.split('watch?v=')[1]?.split('&')[0];
    if (videoId) {
        return <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full h-full absolute inset-0" allowFullScreen allow="autoplay; encrypted-media" title="YouTube video" />;
    }
    return <div className="text-slate-400 p-4 shrink-0 flex w-full h-full justify-center items-center font-bold">Invalid YouTube URL</div>;
};

interface CreationStudioProps {
  onCreate: (topic: string, style: PresentationStyle, fileContext: string, slideCount: number, generateSvg: boolean) => void;
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
  const [createWithImages, setCreateWithImages] = useState(false); // Used for rendering SVG Diagrams

  // Converter State (Home)
  const [fileContext, setFileContext] = useState('');
  const [fileName, setFileName] = useState('');

  // Community State
  const [communityDecks, setCommunityDecks] = useState<SharedPresentation[]>([]);
  const [userHistory, setUserHistory] = useState<Presentation[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFirebaseUploadModal, setShowFirebaseUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [internalLoading, setInternalLoading] = useState(false);
  const [activeCommunityTab, setActiveCommunityTab] = useState('my-saved');
  const [expandedContent, setExpandedContent] = useState<ContentItem | null>(null);

  // Cloud Content State
  const [cloudContent, setCloudContent] = useState<ContentItem[]>([]);
  const [authMode, setAuthMode] = useState<'guest'|'user'|'admin'>(() => {
      return (localStorage.getItem('lakshya_auth') as any) || 'guest';
  });

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
        localStorage.setItem('lakshya_has_seen_tour', 'true');
    }

    // Read from Firebase
    const unsubscribe = subscribeToContent(null, (data) => setCloudContent(data));

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        unsubscribe();
    };
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

  const handleLogin = () => {
      if (authMode !== 'guest') {
          if (confirm("Log out?")) {
              setAuthMode('guest');
              localStorage.setItem('lakshya_auth', 'guest');
          }
          return;
      }
      const code = prompt("Enter Access Code:");
      if (code === 'ss123') {
          setAuthMode('admin');
          localStorage.setItem('lakshya_auth', 'admin');
          alert('Logged in as Admin');
      } else if (code === 'passcode') {
          setAuthMode('user');
          localStorage.setItem('lakshya_auth', 'user');
          alert('Logged in as User');
      } else if (code !== null) {
          alert("Invalid Access Code");
      }
  };

  const handleCloudUpload = async () => {
      if (authMode === 'guest') {
          handleLogin();
          return;
      }
      setShowFirebaseUploadModal(true);
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
        onCreate(fileName ? `Study Guide: ${fileName}` : topic, style, fileContext, slideCount, false); // No SVG in convert mode as requested
     } else {
        onCreate(topic, style, '', slideCount, createWithImages);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                         <div className="mb-8 flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                             <div>
                                 <Label className="text-sky-400 mb-1 block">Generate Advanced SVG Diagrams</Label>
                                 <p className="text-xs text-slate-400">Uses powerful AI to draw scalable diagrams</p>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer">
                               <input type="checkbox" className="sr-only peer" checked={createWithImages} onChange={(e) => setCreateWithImages(e.target.checked)} />
                               <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                             </label>
                         </div>
                         <Button onClick={() => handleCreateAction('architect')} disabled={isLoading || !topic} className="w-full h-12 text-lg bg-sky-600 hover:bg-sky-500">
                            Generate Concepts
                         </Button>
                    </GlassCard>
                </div>
            );

        case 'COMMUNITY':
            const communityTabs = [
                { id: 'my-saved', label: 'My Saved' },
                { id: 'paras', label: 'Paras Jangir' },
                { id: 'ankit', label: 'Ankit Bugaliya' },
                { id: 'imtiyaz', label: 'Imtiyaz Kilaniya' },
                { id: 'dinesh', label: 'Dinesh Pawaria' },
                ...(authMode === 'admin' ? [{ id: 'settings', label: 'Settings' }] : [])
            ];

            const filteredDecks = communityDecks.filter(d => {
                if (activeCommunityTab === 'my-saved') return d.sharedBy.includes('You');
                if (activeCommunityTab === 'paras') return d.sharedBy.toLowerCase().includes('paras');
                if (activeCommunityTab === 'ankit') return d.sharedBy.toLowerCase().includes('ankit');
                if (activeCommunityTab === 'imtiyaz') return d.sharedBy.toLowerCase().includes('imtiyaz');
                if (activeCommunityTab === 'dinesh') return d.sharedBy.toLowerCase().includes('dinesh');
                return true;
            });
            const isCustomSection = ['paras', 'ankit', 'imtiyaz', 'dinesh'].includes(activeCommunityTab);
            const filteredCloudContent = cloudContent.filter(c => c.section === activeCommunityTab && (c.isPublic || authMode === 'admin' || authMode === 'user'));

            return (
                <div className="w-full max-w-5xl animate-fade-in-up flex flex-col h-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h1 className="text-3xl font-bold text-white shrink-0">Community Hub</h1>
                        {isCustomSection ? (
                            <button onClick={handleCloudUpload} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-white text-sm font-bold flex gap-2 shadow-lg shadow-emerald-500/20 shrink-0"><UploadIcon className="w-4 h-4"/> Upload Content</button>
                        ) : (
                            <button onClick={() => authMode !== 'guest' ? setShowUploadModal(true) : handleLogin()} className="bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded-lg text-white text-sm font-bold flex gap-2 shadow-lg shadow-sky-500/20 shrink-0"><UploadIcon className="w-4 h-4"/> Share Notes</button>
                        )}
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-4 mb-4 custom-scrollbar shrink-0 w-full no-scrollbar">
                        {communityTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveCommunityTab(tab.id)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCommunityTab === tab.id ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeCommunityTab === 'settings' && authMode === 'admin' ? (
                        <div className="flex-1 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white">Content Settings</h2>
                                <button onClick={() => { setAuthMode('guest'); localStorage.setItem('lakshya_auth', 'guest'); }} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-500 rounded font-bold transition-all">Exit All Access</button>
                            </div>
                            <div className="bg-slate-900 overflow-hidden border border-slate-700 rounded-xl">
                                {cloudContent.map(c => (
                                    <div key={c.id} className="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-200">{c.title}</p>
                                            <p className="text-xs text-slate-500">Section: {c.section} | Type: {c.type}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-3 py-1 rounded">
                                                <input type="checkbox" checked={c.isPublic} onChange={() => c.id && toggleVisibility(c.id, !c.isPublic)} className="accent-sky-500" />
                                                <span className="text-xs font-bold text-slate-400">Public</span>
                                            </label>
                                            <button onClick={() => c.id && confirm("Delete Content?") && deleteContent(c.id)} className="text-red-400 hover:text-red-300 p-1 bg-red-500/10 rounded"><XIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 overflow-y-auto custom-scrollbar flex-1">
                        {isCustomSection && authMode !== 'guest' && (
                             <GlassCard onClick={handleCloudUpload} className="p-0 overflow-hidden flex flex-col items-center justify-center border-dashed border-sky-500/50 hover:bg-sky-500/5 cursor-pointer min-h-[200px]">
                                 <UploadIcon className="w-8 h-8 text-sky-500 mb-2" />
                                 <p className="font-bold text-sky-400">Upload to {communityTabs.find(t=>t.id===activeCommunityTab)?.label}</p>
                             </GlassCard>
                        )}
                        
                        {filteredCloudContent.map(c => {
                             const renderType = getRenderType(c.type, c.data);
                             return (
                             <GlassCard key={c.id} onClick={() => setExpandedContent(c)} className="p-4 flex flex-col justify-between cursor-pointer hover:border-sky-500/50 transition-colors group">
                                  <div className="w-full">
                                       {renderType === 'image' && (
                                           <div className="w-full aspect-[4/3] rounded-lg mb-3 overflow-hidden bg-slate-900 border border-slate-700/50 relative">
                                               <img src={c.data} alt={c.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"/>
                                           </div>
                                       )}
                                       {renderType === 'youtube' && (
                                           <div className="w-full aspect-[4/3] rounded-lg mb-3 overflow-hidden bg-slate-900 border border-slate-700/50 relative">
                                                {renderYoutube(c.data)}
                                                <div className="absolute inset-0 z-10 hover:bg-black/10 transition-colors cursor-pointer text-transparent"></div>
                                           </div>
                                       )}
                                       {renderType === 'video' && (
                                           <div className="w-full aspect-[4/3] rounded-lg mb-3 overflow-hidden bg-slate-900 border border-slate-700/50 relative">
                                                <video src={c.data} className="w-full h-full object-contain bg-black"/>
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                                    <div className="w-12 h-12 rounded-full bg-sky-500/80 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                                                        <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                    </div>
                                                </div>
                                           </div>
                                       )}
                                       {renderType === 'audio' && (
                                           <div className="w-full aspect-[4/3] rounded-lg mb-3 overflow-hidden bg-gradient-to-br from-indigo-900/40 to-slate-950 border border-slate-700/50 flex flex-col items-center justify-center p-4">
                                                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                                </div>
                                                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Audio Content</span>
                                           </div>
                                       )}
                                       {renderType === 'pdf' && (
                                           <div className="w-full aspect-[4/3] rounded-lg mb-3 overflow-hidden bg-slate-800 border border-slate-700/50 flex flex-col items-center justify-center p-4">
                                                <div className="w-16 h-16 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500 mb-2 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                </div>
                                                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">PDF Document</span>
                                           </div>
                                       )}
                                       {renderType === 'text' && (
                                           <div className="w-full aspect-[4/3] rounded-lg mb-3 overflow-hidden bg-slate-900 border border-slate-700/50 p-4">
                                                <div className="w-full h-full overflow-hidden text-[10px] text-slate-500 font-mono leading-tight">
                                                    <pre className="whitespace-pre-wrap">{c.data}</pre>
                                                </div>
                                           </div>
                                       )}
                                       {(!['image', 'youtube', 'video', 'audio', 'pdf', 'text'].includes(renderType)) && (
                                            <div className="w-full aspect-[4/3] rounded-lg mb-3 overflow-hidden bg-slate-800 border border-slate-700/50 flex flex-col items-center justify-center p-4">
                                                <div className="w-16 h-16 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400 mb-2">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">File Attachment</span>
                                           </div>
                                       )}
                                       <h3 className="font-bold text-white text-lg truncate group-hover:text-sky-400 transition-colors" title={c.title}>{c.title}</h3>
                                       <p className="text-xs text-slate-400">Section: {c.section}</p>
                                  </div>
                                  <div className="flex justify-between items-center mt-4 border-t border-slate-700 pt-3">
                                       <div className="flex items-center gap-2">
                                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.isPublic?'bg-emerald-500/20 text-emerald-400':'bg-red-500/20 text-red-500'}`}>{c.isPublic ? 'Public' : 'Private'}</span>
                                           {authMode !== 'guest' && (
                                               <label className="flex items-center gap-1 cursor-pointer">
                                                   <input type="checkbox" checked={c.isPublic} onChange={(e) => { e.stopPropagation(); c.id && toggleVisibility(c.id, !c.isPublic) }} onClick={e => e.stopPropagation()} className="accent-sky-500 w-3 h-3" />
                                                   <span className="text-[10px] text-slate-400 font-bold">Toggle</span>
                                               </label>
                                           )}
                                       </div>
                                       <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    navigator.clipboard.writeText(c.data); 
                                                    const btn = e.currentTarget;
                                                    const original = btn.innerHTML;
                                                    btn.innerHTML = '<span class="text-[10px] px-1 font-bold">Copied!</span>';
                                                    setTimeout(() => btn.innerHTML = original, 2000);
                                                }} 
                                                className="text-slate-400 hover:text-sky-400 p-1 bg-slate-800 rounded transition-colors"
                                                title="Share / Copy Link"
                                            >
                                                <ShareIcon className="w-4 h-4"/>
                                            </button>
                                            {authMode !== 'guest' && <button onClick={(e) => { e.stopPropagation(); c.id && confirm("Delete Content?") && deleteContent(c.id, c.data) }} className="text-slate-500 hover:text-red-500 p-1 bg-red-500/10 rounded"><XIcon className="w-4 h-4"/></button>}
                                       </div>
                                  </div>
                             </GlassCard>
                             );
                        })}

                        {filteredDecks.length === 0 && filteredCloudContent.length === 0 && (!isCustomSection || authMode === 'guest') ? (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700/50">
                                <CommunityIcon className="w-12 h-12 mb-4 opacity-50" />
                                <p>No notes found in this section.</p>
                            </div>
                        ) : (
                            filteredDecks.map((deck) => (
                                <GlassCard key={deck.id} className="p-0 overflow-hidden group hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:border-sky-500/50 relative border-slate-800/80 transition-all">
                                    <div className={`h-36 w-full flex items-center justify-center ${deck.style === PresentationStyle.Whiteboard ? 'bg-slate-200' : 'bg-slate-900'} relative`}>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                            <div className="w-full h-full bg-slate-900 opacity-20"></div>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                                        <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-col">
                                            <h3 className={`font-bold truncate text-white text-lg`}>{deck.title}</h3>
                                            <p className="text-xs text-sky-400/80">by {deck.sharedBy}</p>
                                        </div>
                                        <button onClick={(e) => handleDeleteCommunity(e, deck.id)} className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500/80 rounded border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all z-20"><XIcon className="w-3 h-3"/></button>
                                    </div>
                                    <div className="p-4 bg-slate-900/90 flex gap-2">
                                        <div className="flex-1 py-2 rounded bg-slate-800/50 border border-slate-700/50 flex items-center justify-center gap-1 text-xs font-bold text-slate-300">
                                            <span className="text-pink-500">♥</span> {deck.likes}
                                        </div>
                                        <button onClick={() => onOpenHistory(deck)} className="flex-[2] py-2 rounded bg-sky-600/20 hover:bg-sky-500 text-xs font-bold text-sky-400 hover:text-white transition-all border border-sky-500/30">Study Note</button>
                                        <button onClick={(e) => handleDownloadDeck(e, deck)} className="py-2 px-3 rounded bg-emerald-600/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all" title="Download JSON">
                                            <DownloadIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </GlassCard>
                            ))
                        )}
                    </div>
                    )}
                    
                    {/* EXPANDED CONTENT MODAL */}
                    {expandedContent && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setExpandedContent(null)}>
                            <div className="max-w-6xl w-full max-h-[90vh] flex flex-col relative" onClick={e=>e.stopPropagation()}>
                                <div className="absolute -top-10 right-0 flex items-center gap-3">
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(expandedContent.data);
                                        const btn = e.currentTarget;
                                        const original = btn.innerHTML;
                                        btn.innerHTML = '<span class="text-white text-xs font-bold px-1 whitespace-nowrap">Copied!</span>';
                                        setTimeout(() => btn.innerHTML = original, 2000);
                                    }} className="text-white bg-sky-500/80 p-2 rounded-full hover:bg-sky-500 transition-colors shadow-lg" title="Share Content Link">
                                        <ShareIcon className="w-5 h-5"/>
                                    </button>
                                    <button onClick={() => setExpandedContent(null)} className="text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors shadow-lg">
                                        <XIcon className="w-6 h-6"/>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto bg-slate-950 rounded-2xl border border-slate-800 p-2 flex flex-col items-center justify-center min-h-[50vh] relative">
                                    <div className="absolute top-4 right-4 flex items-center gap-3 z-20">
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(expandedContent.data);
                                            const btn = e.currentTarget;
                                            const original = btn.innerHTML;
                                            btn.innerHTML = '<span class="text-white text-[10px] font-bold px-1 whitespace-nowrap">Copied!</span>';
                                            setTimeout(() => btn.innerHTML = original, 2000);
                                        }} className="text-white bg-sky-500/80 p-2.5 rounded-xl hover:bg-sky-500 transition-all shadow-lg backdrop-blur-md" title="Share Content Link">
                                            <ShareIcon className="w-5 h-5"/>
                                        </button>
                                        <button onClick={() => setExpandedContent(null)} className="text-white bg-red-500/20 p-2.5 rounded-xl hover:bg-red-500/40 transition-all shadow-lg backdrop-blur-md border border-red-500/20">
                                            <XIcon className="w-6 h-6"/>
                                        </button>
                                    </div>
                                    <div className="w-full h-full flex items-center justify-center p-2">
                                        {(() => {
                                            const expandedRenderType = getRenderType(expandedContent.type, expandedContent.data);
                                            return (
                                            <>
                                        {expandedRenderType === 'image' && <img src={expandedContent.data} alt="content" referrerPolicy="no-referrer" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-[0_0_50px_rgba(56,189,248,0.2)]"/>}
                                        {expandedRenderType === 'youtube' && (
                                            <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl relative">
                                                {renderYoutube(expandedContent.data)}
                                            </div>
                                        )}
                                        {expandedRenderType === 'video' && (
                                            <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl relative">
                                                <video src={expandedContent.data} controls autoPlay referrerPolicy="no-referrer" className="w-full h-full object-contain"/>
                                            </div>
                                        )}
                                        {expandedRenderType === 'audio' && (
                                            <div className="w-full max-w-md p-10 bg-slate-900 rounded-3xl flex flex-col items-center border border-slate-800 shadow-2xl relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-indigo-500/5 pointer-events-none"></div>
                                                <div className="w-24 h-24 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 mb-6 animate-pulse shadow-[0_0_30px_rgba(56,189,248,0.3)]">
                                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                                </div>
                                                <h3 className="text-white font-black text-xl mb-6 tracking-tighter uppercase">Now Playing</h3>
                                                <audio src={expandedContent.data} controls autoPlay referrerPolicy="no-referrer" className="w-full rounded-full"/>
                                            </div>
                                        )}
                                        {expandedRenderType === 'pdf' && (
                                            <div className="w-full h-[80vh] flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                                                <object 
                                                    data={expandedContent.data} 
                                                    type="application/pdf"
                                                    className="w-full flex-1"
                                                >
                                                    <iframe 
                                                        src={`https://docs.google.com/gview?url=${encodeURIComponent(expandedContent.data)}&embedded=true`} 
                                                        className="w-full h-full"
                                                        title="PDF Viewer"
                                                    />
                                                </object>
                                                <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center shrink-0">
                                                    <span className="text-xs text-slate-600 font-bold uppercase truncate max-w-[50%]">{expandedContent.title}</span>
                                                    <a href={expandedContent.data} target="_blank" rel="noreferrer" className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all flex items-center gap-2">
                                                        <DownloadIcon className="w-4 h-4" /> Download Original File
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {expandedRenderType === 'text' && (
                                            <div className="w-full max-w-4xl p-10 bg-slate-900 rounded-3xl text-slate-200 overflow-y-auto max-h-[85vh] border border-slate-800 shadow-2xl leading-relaxed">
                                                <pre className="whitespace-pre-wrap font-sans text-lg">{expandedContent.data}</pre>
                                            </div>
                                        )}
                                        {(!['image', 'youtube', 'video', 'audio', 'pdf', 'text'].includes(expandedRenderType)) && (
                                            <div className="w-full max-w-md p-12 bg-slate-900 rounded-3xl flex flex-col items-center border border-slate-800 shadow-2xl">
                                                <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 mb-6">
                                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </div>
                                                <h3 className="text-white font-bold text-xl mb-2">File Attachment</h3>
                                                <p className="text-slate-500 text-sm mb-8 text-center">This file type cannot be previewed directly.</p>
                                                <a href={expandedContent.data} target="_blank" rel="noreferrer" className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-colors text-center">
                                                    Download File
                                                </a>
                                            </div>
                                        )}
                                        </>
                                        );
                                        })()}
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-between items-center bg-slate-900/80 p-4 rounded-lg border border-slate-800">
                                    <h2 className="text-xl font-bold text-white">{expandedContent.title}</h2>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-slate-400">Section: {expandedContent.section}</span>
                                        <span className="text-xs text-sky-400 font-bold uppercase">{expandedContent.uploader}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                    
                    {/* CUSTOM CLOUD UPLOAD MODAL */}
                    {showFirebaseUploadModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <GlassCard className="max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar p-6 border-sky-500/30 relative">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">Upload to {activeCommunityTab}</h3>
                                    <button onClick={() => setShowFirebaseUploadModal(false)}><XIcon className="w-6 h-6"/></button>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const fd = new FormData(e.currentTarget);
                                    const title = fd.get('title') as string;
                                    const type = fd.get('type') as string;
                                    const isPublic = fd.get('isPublic') === 'on';
                                    let data = fd.get('dataUrl') as string;
                                    
                                    const file = (fd.get('fileInput') as File);
                                    
                                    setUploading(true);
                                    setUploadProgress(0);
                                    
                                    let actualType = type;
                                    
                                    try {
                                        if (file && file.size > 0) {
                                            const fname = file.name.toLowerCase();
                                            if (file.type.includes('image') || fname.match(/\.(jpg|jpeg|png|gif|webp)$/)) actualType = 'image';
                                            else if (file.type.includes('video') || fname.match(/\.(mp4|webm|ogg|mov)$/)) actualType = 'video';
                                            else if (file.type.includes('audio') || fname.match(/\.(mp3|wav|ogg|m4a)$/)) actualType = 'audio';
                                            else if (file.type.includes('pdf') || fname.match(/\.pdf$/)) actualType = 'pdf';
                                            else if (file.type.includes('text') || fname.endsWith('.txt')) actualType = 'text';
                                            else actualType = type; // Fallback to user selection if browser detection fails

                                            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                                            const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
                                            
                                            if (!cloudName || !uploadPreset) {
                                                throw new Error("Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET in environment variables. You must set these for Cloudinary uploads to work on Vercel.");
                                            }

                                            let resourceType = 'auto';
                                            if (actualType === 'video' || actualType === 'audio') resourceType = 'video';
                                            else if (actualType === 'pdf') resourceType = 'raw';

                                            data = await new Promise<string>((resolve, reject) => {
                                                const xhr = new XMLHttpRequest();
                                                xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, true);
                                                
                                                xhr.upload.onprogress = (e) => {
                                                    if (e.lengthComputable) {
                                                        const percentComplete = (e.loaded / e.total) * 100;
                                                        setUploadProgress(percentComplete);
                                                    }
                                                };
                                                
                                                xhr.onload = () => {
                                                    if (xhr.status === 200) {
                                                        const response = JSON.parse(xhr.responseText);
                                                        resolve(response.secure_url);
                                                    } else {
                                                        try {
                                                            const response = JSON.parse(xhr.responseText);
                                                            reject(new Error(response.error?.message || "Upload failed"));
                                                        } catch(e) {
                                                            reject(new Error("Upload failed"));
                                                        }
                                                    }
                                                };
                                                
                                                xhr.onerror = () => {
                                                    reject(new Error("Network error during upload"));
                                                };
                                                
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                formData.append('upload_preset', uploadPreset);
                                                xhr.send(formData);
                                            });
                                        }

                                        if (!title || !data) {
                                            setUploading(false);
                                            setUploadProgress(0);
                                            return alert("Title and Content/File are required.");
                                        }

                                        await uploadContent({
                                            title,
                                            type: actualType as any,
                                            data,
                                            isPublic,
                                            section: activeCommunityTab,
                                            createdAt: Date.now(),
                                            uploader: authMode
                                        });
                                        setShowFirebaseUploadModal(false);
                                    } catch (err) {
                                        alert("Upload failed. " + (err instanceof Error ? err.message : String(err)));
                                    } finally {
                                        setUploading(false);
                                        setUploadProgress(0);
                                    }
                                }} className="space-y-4">
                                   <div>
                                       <Label>Title</Label>
                                       <input name="title" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" placeholder="Content title..." />
                                    </div>
                                    <div>
                                        <Label>Content Type</Label>
                                        <Select name="type" className="w-full bg-slate-900">
                                            <option value="image">Image (JPG, PNG)</option>
                                            <option value="video">Video (MP4)</option>
                                            <option value="audio">Audio</option>
                                            <option value="pdf">PDF</option>
                                            <option value="text">Text / Link</option>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-700 bg-slate-900/50">
                                        <Label>Source (File OR URL/Text)</Label>
                                        <input type="file" name="fileInput" className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20" />
                                        <Textarea name="dataUrl" placeholder="Or paste link/text here..." className="h-20 bg-black/20" />
                                    </div>
                                   <label className="flex items-center gap-3 py-2 cursor-pointer">
                                       <input type="checkbox" name="isPublic" defaultChecked className="accent-sky-500 w-4 h-4" />
                                       <span className="text-sm text-slate-300">Make Public</span>
                                   </label>
                                   <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 py-3 relative overflow-hidden" disabled={uploading}>
                                       {uploading ? (
                                            <span className="flex items-center justify-center gap-3">
                                                <div className="relative w-6 h-6">
                                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/20" strokeWidth="3" />
                                                        <circle 
                                                            cx="18" cy="18" r="16" fill="none" className="stroke-white transition-all duration-300" strokeWidth="3" 
                                                            strokeDasharray="100" strokeDashoffset={`${100 - (Math.round(uploadProgress) || 5)}`} strokeLinecap="round" 
                                                        />
                                                    </svg>
                                                </div>
                                                <span className="font-bold">Uploading {Math.round(uploadProgress)}%</span>
                                            </span>
                                       ) : 'Upload Content'}
                                   </Button>
                                </form>
                            </GlassCard>
                        </div>
                    )}
                </div>
            );
    }
  };

  const isMobileChat = activeTab === 'CHAT';

  return (
    <div className="h-[100dvh] w-screen bg-slate-950 text-slate-200 flex flex-col lg:flex-row overflow-hidden font-sans">
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
         <div className="px-6 mb-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.4)]"><span className="text-white font-black text-xl">L</span></div>
                <span className="font-black text-lg text-white tracking-tight">Lakshya Studio</span>
            </div>
            <button 
                onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-sky-500 text-white rounded-full font-bold shadow-2xl z-[200] animate-fade-in-up';
                    toast.innerText = 'Page link copied to clipboard!';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 2000);
                }}
                className="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition-all hover:scale-110 active:scale-95"
                title="Share Study Portal"
            >
                <ShareIcon className="w-5 h-5"/>
            </button>
         </div>
         <div className="px-6 mb-6">
             <button onClick={handleLogin} className="w-full text-xs font-bold px-3 py-2 rounded bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors uppercase">
                {authMode === 'guest' ? 'LOGIN' : authMode === 'admin' ? 'ADMIN LOGOUT' : 'LOGOUT'}
             </button>
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
        className={activeTab === 'CHAT' ? 'flex-1 relative z-10 flex flex-col h-full overflow-hidden w-full lg:rounded-tl-3xl bg-slate-950' : 'flex-1 overflow-y-auto relative z-10 p-4 pb-20 lg:p-12 flex flex-col items-center w-full'}
      >
         {/* Mobile Header - Hide only for Chat to give full screen feel */}
         {activeTab !== 'CHAT' && (
             <div className="lg:hidden w-full flex justify-between items-center mb-6 shrink-0 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0"><span className="text-white font-black text-sm">L</span></div>
                     <span className="font-black text-lg text-white">Lakshya Studio</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert("Page link copied to clipboard!");
                        }}
                        className="p-2 rounded-full bg-white/5 text-sky-400 border border-white/5"
                    >
                        <ShareIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={handleLogin} className="text-xs font-bold px-3 py-1.5 rounded bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors uppercase">
                        {authMode === 'guest' ? 'LOGIN' : authMode === 'admin' ? 'ADMIN LOGOUT' : 'LOGOUT'}
                    </button>
                 </div>
             </div>
         )}
         {renderContent()}
      </main>

      {/* Mobile Nav */}
      <div className="lg:hidden shrink-0 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 flex justify-around items-center z-50 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
         <button id="nav-home-mob" onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all active:scale-95 ${activeTab === 'HOME' ? 'text-sky-400 bg-sky-500/10 shadow-[inset_0_0_10px_rgba(56,189,248,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}>
            <HomeIcon className={`w-6 h-6 ${activeTab === 'HOME' ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : ''}`}/>
            <span className="text-[10px] font-bold mt-1">Home</span>
         </button>
         
         <button id="nav-chat-mob" onClick={() => setActiveTab('CHAT')} className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all active:scale-95 ${activeTab === 'CHAT' ? 'text-sky-400 bg-sky-500/10 shadow-[inset_0_0_10px_rgba(56,189,248,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}>
            <RobotIcon className={`w-6 h-6 ${activeTab === 'CHAT' ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : ''}`}/>
            <span className="text-[10px] font-bold mt-1">Tutor</span>
         </button>

         <button id="nav-create-mob" onClick={() => setActiveTab('CREATE')} className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all active:scale-95 ${activeTab === 'CREATE' ? 'text-sky-400 bg-sky-500/10 shadow-[inset_0_0_10px_rgba(56,189,248,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}>
            <CreateIcon className={`w-6 h-6 ${activeTab === 'CREATE' ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : ''}`}/>
            <span className="text-[10px] font-bold mt-1">Create</span>
         </button>

         <button id="nav-comm-mob" onClick={() => setActiveTab('COMMUNITY')} className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all active:scale-95 ${activeTab === 'COMMUNITY' ? 'text-sky-400 bg-sky-500/10 shadow-[inset_0_0_10px_rgba(56,189,248,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}>
            <CommunityIcon className={`w-6 h-6 ${activeTab === 'COMMUNITY' ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : ''}`}/>
            <span className="text-[10px] font-bold mt-1">Community</span>
         </button>
      </div>
    </div>
  );
};

export default CreationStudio;
