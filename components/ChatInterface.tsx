
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

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'welcome', role: 'model', text: 'Namaste! I am Lakshya. You can chat with me or start a Live Voice Session in Hinglish. 🎙️', timestamp: Date.now() }
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
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
        // Note: We can't explicitly "close" the session promise, but cutting audio context effectively kills the client side processing
    };

    const startLiveSession = async () => {
        if (isLive || isConnecting) return;
        setIsConnecting(true);

        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API Key missing");
            const ai = new GoogleGenAI({ apiKey });

            // 1. Audio Setup
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            inputContextRef.current = inputCtx;
            audioContextRef.current = outputCtx;
            nextStartTimeRef.current = 0;

            // Output Node
            const outputNode = outputCtx.createGain();
            outputNode.connect(outputCtx.destination);

            // Input Stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const source = inputCtx.createMediaStreamSource(stream);
            
            // Worklet/ScriptProcessor for streaming input
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Visualizer Volume Math
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);
                setLiveVolume(Math.min(rms * 10, 1)); 

                // Encode PCM
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

            // 2. Connect to Gemini Live
            const langConfig = LANGUAGES.find(l => l.id === selectedLanguage) || LANGUAGES[0];
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.log("Live Connected");
                        setIsLive(true);
                        setIsConnecting(false);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            if (!audioContextRef.current) return;
                            
                            // Ensure smooth playback timing
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                            
                            const audioBuffer = await decodeAudioData(
                                decode(base64Audio),
                                audioContextRef.current,
                                24000,
                                1
                            );
                            
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
                        console.log("Live Closed");
                        stopLiveSession();
                    },
                    onerror: (e) => {
                        console.error("Live Error", e);
                        stopLiveSession();
                        alert("Connection to AI Voice Agent failed.");
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                    },
                    systemInstruction: langConfig.prompt
                }
            });

            sessionRef.current = sessionPromise;

        } catch (error) {
            console.error("Live setup error:", error);
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
        <div className="w-full h-full flex flex-col bg-slate-950 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(56,189,248,0.4) 1px, transparent 0)', 
                     backgroundSize: '24px 24px' 
                 }}>
            </div>

            {/* Header */}
            <header className="shrink-0 h-16 border-b border-white/5 bg-slate-900/80 backdrop-blur flex items-center justify-between px-4 z-20">
                <div className="flex items-center gap-3">
                    <Avatar role="model" />
                    <div>
                        <h2 className="text-white font-bold text-sm">Lakshya Voice Agent</h2>
                        <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                             <span className="text-xs text-slate-400">{isLive ? 'Live On Air' : 'Ready'}</span>
                        </div>
                    </div>
                </div>
                
                {/* Language Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 hidden md:inline">Voice Language:</span>
                    <select 
                        value={selectedLanguage}
                        onChange={(e) => {
                            if (isLive) {
                                alert("Please stop the current live session to change language.");
                                return;
                            }
                            setSelectedLanguage(e.target.value);
                        }}
                        disabled={isLive}
                        className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg py-1 px-2 focus:ring-1 focus:ring-sky-500 outline-none"
                    >
                        {LANGUAGES.map(l => (
                            <option key={l.id} value={l.id}>{l.label}</option>
                        ))}
                    </select>
                </div>
            </header>

            {/* Main Area */}
            <div className="flex-1 relative flex flex-col items-center justify-center p-4">
                
                {isLive ? (
                    // --- LIVE VISUALIZER ---
                    <div className="flex flex-col items-center animate-fade-in-up">
                         <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center mb-8">
                             {/* Pulsing Rings */}
                             <div className="absolute inset-0 rounded-full border-2 border-sky-500/20 animate-ping-slow" style={{ animationDuration: '3s' }}></div>
                             <div className="absolute inset-4 rounded-full border border-sky-400/10 animate-spin-slow" style={{ animationDuration: '10s' }}></div>
                             <div className="absolute inset-[-20px] rounded-full border border-indigo-500/10 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '7s' }}></div>

                             {/* Dynamic Core */}
                             <div 
                                className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-full shadow-[0_0_60px_rgba(14,165,233,0.5)] flex items-center justify-center transition-transform duration-75 ease-linear"
                                style={{ transform: `scale(${1 + liveVolume * 0.4})` }}
                             >
                                 <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                 </svg>
                             </div>
                         </div>
                         <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Listening...</h3>
                         <p className="text-slate-400 text-sm">Speak naturally in {selectedLanguage}</p>
                         
                         <button 
                            onClick={stopLiveSession}
                            className="mt-8 px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-full font-bold transition-all hover:scale-105 flex items-center gap-2"
                         >
                            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                            End Live Session
                         </button>
                    </div>
                ) : (
                    // --- TEXT CHAT VIEW ---
                    <div className="w-full h-full flex flex-col max-w-3xl">
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800" ref={scrollRef}>
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
                                    <Avatar role={msg.role} />
                                    <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-sky-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-sm'}`}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-4 animate-fade-in-up">
                                    <Avatar role="model" />
                                    <div className="bg-slate-800 rounded-2xl p-4 border border-white/5 flex gap-1 items-center">
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            {!isLive && (
                <div className="shrink-0 p-4 bg-slate-900/50 backdrop-blur-md border-t border-white/5 z-20">
                    <div className="max-w-3xl mx-auto flex gap-3 items-end">
                        <button 
                            onClick={startLiveSession}
                            disabled={isConnecting}
                            className="shrink-0 h-12 w-12 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 group relative"
                            title="Start Live Voice"
                        >
                            {isConnecting ? (
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-sky-600 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        Start Voice
                                    </div>
                                </>
                            )}
                        </button>

                        <div className="flex-1 relative">
                            <Textarea 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="!bg-slate-800 !border-slate-700 !rounded-2xl !py-3 !pr-12 min-h-[48px] max-h-[120px] resize-none"
                            />
                            <button 
                                onClick={handleSendText}
                                disabled={!input.trim() || isTyping}
                                className="absolute right-2 bottom-2 p-2 text-sky-500 hover:text-sky-400 disabled:opacity-50 transition-colors"
                            >
                                <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
