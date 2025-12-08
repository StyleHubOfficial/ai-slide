
import React, { useState, useRef, useEffect } from 'react';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import RobotIcon from './icons/RobotIcon';
import Spinner from './ui/Spinner';
import Avatar from './ui/Avatar';
import { ChatMessage, AiModelId } from '../types';
import { sendChatMessage } from '../services/geminiService';

const MODELS: { id: AiModelId; label: string; desc: string; icon: React.ReactNode }[] = [
    { 
        id: 'gemini-2.5-flash', 
        label: 'Flash 2.5', 
        desc: 'Balanced', 
        icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    },
    { 
        id: 'gemini-flash-lite-latest', 
        label: 'Flash Lite', 
        desc: 'Fastest', 
        icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
    },
    { 
        id: 'gemini-3-pro-preview', 
        label: 'Gemini 3', 
        desc: 'Reasoning', 
        icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
    },
];

// Tech Doodle Background Pattern (Data URI)
const TECH_BG_PATTERN = `data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2338bdf8' fill-opacity='0.08'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 15.523 0 10s4.477-10 10-10zm10 8c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM30 60h20v20H30V60zm0-20h20v20H30V40z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'welcome', role: 'model', text: 'Hello! I am Lakshya AI. Select a model above and ask me anything about presentations. 🤖✨', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false); // State for button animation
    const [selectedModel, setSelectedModel] = useState<AiModelId>('gemini-2.5-flash');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Prepare particles for animation
    const particles = useRef(Array.from({ length: 12 }).map(() => ({
        angle: Math.random() * 360,
        dist: 40 + Math.random() * 40,
        size: 2 + Math.random() * 3
    }))).current;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping || isSending) return;

        // Trigger button animation
        setIsSending(true);

        const textToSend = input.trim();
        setInput(''); // Clear input immediately

        // Delay processing slightly to allow animation to play
        setTimeout(async () => {
            const userMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'user',
                text: textToSend,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, userMsg]);
            setIsTyping(true);
            setIsSending(false); // Reset button animation state

            try {
                const responseText = await sendChatMessage(messages, userMsg.text, selectedModel);
                
                const botMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'model',
                    text: responseText,
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, botMsg]);
            } catch (error) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'model',
                    text: "Sorry, I encountered a network error. Please try again. ⚠️",
                    timestamp: Date.now()
                }]);
            } finally {
                setIsTyping(false);
            }
        }, 600); // Increased delay for full flight animation
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-full h-full flex flex-col animate-fade-in-up pb-6">
            <header className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400">
                        <RobotIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
                        <p className="text-xs text-slate-400">Powered by Gemini 2.5 & 3.0</p>
                    </div>
                </div>

                {/* Model Selector */}
                <div className="bg-slate-900/50 p-1 rounded-lg border border-white/10 flex gap-1 overflow-x-auto">
                    {MODELS.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedModel(m.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                                selectedModel === m.id 
                                ? 'bg-sky-600 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                            title={m.desc}
                        >
                            {m.icon}
                            <div className="flex flex-col items-start leading-none">
                                <span>{m.label}</span>
                                <span className="text-[9px] opacity-70 font-normal">{m.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </header>

            <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden bg-slate-950 border-slate-700/50 relative">
                
                {/* Tech Pattern Background (WhatsApp style but techy) */}
                <div 
                    className="absolute inset-0 opacity-[0.4] pointer-events-none"
                    style={{
                        backgroundImage: `url("${TECH_BG_PATTERN}")`,
                        backgroundSize: '80px 80px',
                        backgroundRepeat: 'repeat'
                    }}
                ></div>

                {/* Messages Area */}
                <div 
                    ref={scrollRef} 
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth relative z-10"
                >
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex w-full gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <Avatar role={msg.role} />
                            
                            <div className={`max-w-[75%] md:max-w-[70%] p-4 rounded-2xl text-sm md:text-base leading-relaxed whitespace-pre-wrap shadow-lg transition-all duration-300 hover:scale-[1.01] ${
                                msg.role === 'user' 
                                    ? 'bg-gradient-to-br from-sky-600 to-sky-700 text-white rounded-tr-none shadow-sky-900/20' 
                                    : 'bg-slate-800/90 backdrop-blur-sm text-slate-200 rounded-tl-none border border-slate-700/50 shadow-black/20'
                            }`}>
                                {msg.text}
                                <div className={`text-[9px] mt-2 text-right opacity-50 ${msg.role === 'user' ? 'text-sky-100' : 'text-slate-500'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Animated Typing Indicator */}
                    {isTyping && (
                        <div className="flex w-full gap-4 animate-fade-in-up">
                            <Avatar role="model" />
                            <div className="bg-slate-800/80 backdrop-blur-sm text-slate-400 p-4 rounded-2xl rounded-tl-none border border-slate-700/50 flex items-center gap-3 shadow-[0_0_15px_rgba(56,189,248,0.1)] relative overflow-hidden group">
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-sky-500/5 animate-pulse"></div>
                                
                                <div className="flex gap-1.5 h-3 items-center relative z-10">
                                    <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce shadow-[0_0_8px_currentColor]"></span>
                                    <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-100 shadow-[0_0_8px_currentColor]"></span>
                                    <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-200 shadow-[0_0_8px_currentColor]"></span>
                                </div>
                                <span className="text-xs text-sky-400/90 font-medium animate-pulse relative z-10">Generating Response...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900/90 border-t border-white/5 backdrop-blur-xl relative z-20">
                    <div className="relative flex gap-2">
                        <Textarea 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Ask ${MODELS.find(m => m.id === selectedModel)?.label} anything...`}
                            className="min-h-[60px] max-h-[120px] bg-black/40 border-slate-700 focus:border-sky-500 rounded-xl pr-16 resize-none transition-all focus:bg-black/60 focus:shadow-[0_0_20px_rgba(14,165,233,0.1)]"
                        />
                        <Button 
                            onClick={handleSend} 
                            disabled={!input.trim() || isTyping || isSending}
                            className={`absolute right-2 bottom-2 w-12 h-12 p-0 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-900/50 transition-all duration-300 overflow-visible ${isSending ? 'bg-emerald-600 scale-90' : 'scale-100'}`}
                        >
                            {/* Neon Particles on Send */}
                            {isSending && particles.map((p, i) => {
                                const tx = Math.cos(p.angle * Math.PI / 180) * p.dist;
                                const ty = Math.sin(p.angle * Math.PI / 180) * p.dist;
                                return (
                                    <div 
                                        key={i}
                                        className="absolute left-1/2 top-1/2 bg-cyan-300 rounded-full animate-particle-out pointer-events-none"
                                        style={{
                                            width: p.size,
                                            height: p.size,
                                            '--tx': `${tx}px`,
                                            '--ty': `${ty}px`,
                                            boxShadow: '0 0 6px rgba(103,232,249,0.8)'
                                        } as React.CSSProperties}
                                    />
                                );
                            })}

                            {/* Animated Icon Container */}
                            <div className={`transition-all duration-500 transform ease-in-out ${isSending ? 'translate-x-12 -translate-y-12 opacity-0 rotate-45 scale-75' : 'translate-x-0 opacity-100'}`}>
                                <svg className="w-6 h-6 text-white transform rotate-90 ml-0.5 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </div>
                        </Button>
                    </div>
                    <div className="text-center mt-2 flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                        <p className="text-[10px] text-slate-500">Secure connection to {MODELS.find(m => m.id === selectedModel)?.label}</p>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

export default ChatInterface;
