
import React, { useState, useRef, useEffect } from 'react';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import Avatar from './ui/Avatar';
import { ChatMessage, AiModelId } from '../types';
import { sendChatMessage } from '../services/geminiService';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import Select from './ui/Select';

// Live Mode Languages
const LANGUAGES = [
    { id: 'Hinglish', label: 'Hinglish (Default)', prompt: "You are Lakshya, a friendly and smart AI tutor. You speak in Hinglish (a natural mix of Hindi and English). Your tone is conversational, encouraging, and educational, like an Indian professor or friend. Use Hindi words for emphasis." },
    { id: 'Hindi', label: 'Hindi', prompt: "आप लक्ष्य हैं, एक सहायक और बुद्धिमान AI शिक्षक। कृपया शुद्ध और सरल हिंदी में बात करें। आपका लहज़ा विनम्र और उत्साहजनक होना चाहिए।" },
    { id: 'English', label: 'English', prompt: "You are Lakshya, a helpful AI tutor. Please respond in clear, concise, and professional English." },
];

// --- Helpers for Live API ---
const getApiKey = () => {
  let apiKey = '';
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    apiKey = (import.meta as any).env.VITE_API_KEY || (import.meta as any).env.API_KEY;
  }
  if (!apiKey && typeof process !== 'undefined' && process.env) {
    apiKey = process.env.NEXT_PUBLIC_API_KEY;
  }
  if (!apiKey && typeof process !== 'undefined' && process.env) {
    apiKey = process.env.API_KEY || process.env.REACT_APP_API_KEY;
  }
  return apiKey;
};

// Custom Audio Decoding for Raw PCM
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Particle Component for Background
const BackgroundParticles = () => {
  const [particles, setParticles] = useState<any[]>([]);
  
  useEffect(() => {
    // Generate static particle config on mount to avoid re-renders
    const p = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 80 + 20}px`,
      duration: `${Math.random() * 15 + 15}s`,
      delay: `${Math.random() * 10}s`
    }));
    setParticles(p);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <div 
           key={p.id}
           className="particle"
           style={{
             left: p.left,
             width: p.size,
             height: p.size,
             animationDuration: p.duration,
             animationDelay: p.delay
           }}
        />
      ))}
    </div>
  );
};

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'welcome', role: 'model', text: 'Namaste! I am Lakshya, your advanced AI Tutor. How can I help you master your subjects today?', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    // --- Live Mode State ---
    const [isLive, setIsLive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].id);
    const [liveVolume, setLiveVolume] = useState(0); 

    // --- Live Mode Refs ---
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const sessionRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopLiveSession();
        };
    }, []);

    const stopLiveSession = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (inputContextRef.current) {
            inputContextRef.current.close();
            inputContextRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        
        setIsLive(false);
        setIsConnecting(false);
        setLiveVolume(0);
    };

    const startLiveSession = async () => {
        if (isLive || isConnecting) return;
        setIsConnecting(true);

        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey });

            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            inputContextRef.current = inputCtx;
            audioContextRef.current = outputCtx;
            nextStartTimeRef.current = 0;

            const outputNode = outputCtx.createGain();
            outputNode.connect(outputCtx.destination);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const source = inputCtx.createMediaStreamSource(stream);
            
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);
                setLiveVolume(Math.min(rms * 10, 1)); 

                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                    int16[i] = inputData[i] * 32768;
                }
                const base64Data = encode(new Uint8Array(int16.buffer));

                if (sessionRef.current) {
                    sessionRef.current.then((session: any) => {
                        session.sendRealtimeInput({
                            media: {
                                mimeType: 'audio/pcm;rate=16000',
                                data: base64Data
                            }
                        });
                    });
                }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);

            const langConfig = LANGUAGES.find(l => l.id === selectedLanguage) || LANGUAGES[0];
            
            // Updated to latest model with search support
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        setIsLive(true);
                        setIsConnecting(false);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            if (!audioContextRef.current) return;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                            const sourceNode = audioContextRef.current.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(outputNode);
                            sourceNode.addEventListener('ended', () => {
                                sourcesRef.current.delete(sourceNode);
                            });
                            sourceNode.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(sourceNode);
                        }
                    },
                    onclose: () => {
                        stopLiveSession();
                    },
                    onerror: (e) => {
                        stopLiveSession();
                        alert("Connection to AI Voice Agent failed.");
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                    },
                    systemInstruction: langConfig.prompt,
                    tools: [{ googleSearch: {} }] // Enabled Live Search Grounding
                }
            });

            sessionRef.current = sessionPromise;

        } catch (error) {
            setIsConnecting(false);
            alert("Could not start audio session. Please check microphone permissions.");
        }
    };

    const handleSendText = async () => {
        if (!input.trim() || isTyping) return;
        const text = input.trim();
        setInput('');
        
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() }]);
        setIsTyping(true);

        try {
            const result = await sendChatMessage(messages, text, 'gemini-2.5-flash');
            setMessages(prev => [...prev, { 
                id: (Date.now() + 1).toString(), 
                role: 'model', 
                text: result.text, 
                timestamp: Date.now() 
            }]);
        } catch (e) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Connection error.", timestamp: Date.now() }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-950 relative overflow-hidden font-sans">
            {/* --- Hi-Tech Background --- */}
            <div className="absolute inset-0 bg-slate-950 z-0">
                <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/90"></div>
            </div>
            <BackgroundParticles />

            {/* --- Header --- */}
            <header className="shrink-0 h-16 border-b border-sky-500/10 bg-slate-900/60 backdrop-blur-md flex items-center justify-between px-6 z-20 relative shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar role="model" className="!w-10 !h-10 border border-sky-400/30" />
                        {isLive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>}
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                            LAKSHYA <span className="text-sky-400 font-normal opacity-70">AI TUTOR</span>
                        </h2>
                        <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-emerald-500 shadow-[0_0_8px_emerald]'}`}></div>
                             <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{isLive ? 'Live Voice Active' : 'System Online'}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 bg-slate-800/50 p-1 rounded-lg border border-white/5">
                    <span className="text-[10px] text-slate-400 font-bold px-2 uppercase tracking-wider hidden md:block">Output Lang</span>
                    <select 
                        value={selectedLanguage}
                        onChange={(e) => {
                            if (isLive) return;
                            setSelectedLanguage(e.target.value);
                        }}
                        disabled={isLive}
                        className="bg-slate-900 text-xs text-sky-400 font-bold border border-slate-700 rounded-md py-1 px-3 focus:ring-1 focus:ring-sky-500 outline-none uppercase tracking-wide cursor-pointer disabled:opacity-50"
                    >
                        {LANGUAGES.map(l => (
                            <option key={l.id} value={l.id}>{l.id.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </header>

            {/* --- Main Area --- */}
            {/* Added overflow-hidden to parent and flex-1 to allow scroll container to work properly */}
            <div className="flex-1 relative flex flex-col w-full overflow-hidden z-10">
                
                {isLive ? (
                    // --- LIVE VISUALIZER MODE ---
                    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in-up">
                         {/* Core Reactor Visual */}
                         <div className="relative w-64 h-64 flex items-center justify-center mb-12">
                             <div className="absolute inset-0 rounded-full border border-sky-500/20 animate-[spin_10s_linear_infinite]"></div>
                             <div className="absolute inset-4 rounded-full border border-dashed border-indigo-500/20 animate-[spin_15s_linear_infinite_reverse]"></div>
                             <div className="absolute inset-[-20px] rounded-full border border-sky-500/5 animate-pulse"></div>

                             {/* Dynamic Core */}
                             <div 
                                className="w-40 h-40 rounded-full bg-slate-900 border border-sky-500/30 shadow-[0_0_50px_rgba(14,165,233,0.2)] flex items-center justify-center transition-all duration-75 ease-linear relative overflow-hidden"
                                style={{ transform: `scale(${1 + liveVolume * 0.2})`, boxShadow: `0 0 ${30 + liveVolume * 50}px rgba(14,165,233,${0.3 + liveVolume * 0.5})` }}
                             >
                                 <div className="absolute inset-0 bg-gradient-to-tr from-sky-600/20 to-indigo-600/20 backdrop-blur-sm"></div>
                                 <svg className="w-16 h-16 text-white relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                 </svg>
                             </div>
                         </div>
                         
                         <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-sky-400 mb-2 tracking-tight">LISTENING MODE ACTIVE</h3>
                         <div className="flex flex-col items-center gap-2 mb-8">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                <p className="text-sky-300/60 font-mono text-sm uppercase tracking-widest">Channel: {selectedLanguage}</p>
                            </div>
                            {/* Live Search Badge */}
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                                <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Google Search Enabled</span>
                            </div>
                         </div>
                         
                         <button 
                            onClick={stopLiveSession}
                            className="group relative px-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-full font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] flex items-center gap-3 overflow-hidden"
                         >
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                            <div className="w-2 h-2 bg-red-500 rounded-sm shadow-[0_0_5px_red]"></div>
                            TERMINATE SESSION
                         </button>
                    </div>
                ) : (
                    // --- TEXT CHAT MODE ---
                    <div className="w-full h-full max-w-5xl mx-auto flex flex-col">
                        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent" ref={scrollRef}>
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up group`}>
                                    <div className={`mt-1 ${msg.role === 'user' ? 'hidden' : 'block'}`}>
                                       <Avatar role={msg.role} className="!w-8 !h-8 !border-sky-500/30" />
                                    </div>
                                    
                                    <div className={`max-w-[85%] lg:max-w-[70%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{msg.role === 'user' ? 'YOU' : 'LAKSHYA AI'}</span>
                                            <span className="text-[10px] text-slate-700">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        
                                        <div 
                                          className={`relative p-4 md:p-5 text-sm md:text-base leading-relaxed backdrop-blur-sm transition-all duration-300
                                            ${msg.role === 'user' 
                                                ? 'bg-gradient-to-br from-sky-600 to-blue-700 text-white rounded-2xl rounded-tr-sm shadow-[0_4px_20px_rgba(14,165,233,0.3)] border border-sky-400/20' 
                                                : 'bg-slate-900/80 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-sky-500/30 hover:shadow-[0_0_30px_rgba(14,165,233,0.1)]'
                                            }
                                          `}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-4 animate-fade-in-up">
                                    <Avatar role="model" className="!w-8 !h-8" />
                                    <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/50 flex gap-1.5 items-center h-12">
                                        <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- Footer Controls --- */}
            {!isLive && (
                <div className="shrink-0 p-4 md:p-6 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 z-20 relative">
                    <div className="max-w-4xl mx-auto flex gap-4 items-end">
                        {/* Live Button */}
                        <button 
                            onClick={startLiveSession}
                            disabled={isConnecting}
                            className="shrink-0 h-14 w-14 rounded-2xl bg-slate-900 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 flex items-center justify-center text-sky-400 transition-all duration-300 group disabled:opacity-50 hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] relative overflow-hidden"
                            title="Start Live Voice"
                        >
                            <div className="absolute inset-0 bg-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {isConnecting ? (
                                <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            )}
                        </button>

                        {/* Text Input Area */}
                        <div className="flex-1 relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-2xl opacity-20 group-focus-within:opacity-70 transition duration-500 blur-[1px]"></div>
                            <div className="relative bg-slate-900 rounded-2xl flex items-center">
                                <Textarea 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask Lakshya anything..."
                                    className="!bg-transparent !border-none !ring-0 !text-slate-200 !placeholder-slate-500 !py-4 !px-4 min-h-[56px] max-h-[140px] resize-none w-full text-base focus:!ring-0"
                                />
                                <button 
                                    onClick={handleSendText}
                                    disabled={!input.trim() || isTyping}
                                    className="mr-2 p-3 text-white bg-sky-600 hover:bg-sky-500 rounded-xl disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-lg shadow-sky-900/50 hover:shadow-sky-500/30"
                                >
                                    <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
