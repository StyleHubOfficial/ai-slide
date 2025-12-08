
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
        <div className="w-full h-full flex flex-col bg-slate-950">
            {/* App Bar / Header */}
            <header className="shrink-0 flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-md border-b border-white/5 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <Avatar role="model" />
                    <div>
                        <h1 className="text-base md:text-lg font-bold text-white leading-tight">Lakshya Assistant</h1>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs text-slate-400">Online</span>
                        </div>
                    </div>
                </div>

                {/* Model Selector - Compact */}
                <div className="bg-slate-800 p-0.5 rounded-lg border border-white/10 flex gap-0.5 overflow-hidden">
                    {MODELS.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedModel(m.id)}
                            className={`p-2 rounded md:px-3 md:py-1.5 flex items-center gap-2 transition-all ${
                                selectedModel === m.id 
                                ? 'bg-sky-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                            title={m.desc}
                        >
                            {m.icon}
                            <span className="hidden md:inline text-xs font-bold">{m.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Chat Area */}
            <div className="flex-1 relative flex flex-col overflow-hidden bg-slate-950">
                {/* Tech Pattern Background */}
                <div 
                    className="absolute inset-0 opacity-[0.3] pointer-events-none"
                    style={{
                        backgroundImage: `url("${TECH_BG_PATTERN}")`,
                        backgroundSize: '120px 120px',
                        backgroundRepeat: 'repeat'
                    }}
                ></div>

                {/* Messages List */}
                <div 
                    ref={scrollRef} 
                    className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar scroll-smooth relative z-10 pb-20"
                >
                    {/* Welcome Spacer */}
                    <div className="h-4"></div>

                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex w-full gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar only for Model to save space/Telegram style usually doesn't show own avatar, but we keep consistent UX */}
                            {msg.role === 'model' && <Avatar role="model" className="mt-auto mb-1" />}
                            
                            <div className={`max-w-[85%] md:max-w-[70%] min-w-[60px] relative group`}>
                                <div className={`p-3 md:p-4 rounded-2xl text-sm md:text-base leading-relaxed whitespace-pre-wrap shadow-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-sky-600 text-white rounded-br-none shadow-sky-900/10' 
                                        : 'bg-slate-800 text-slate-200 rounded-bl-none shadow-black/30'
                                }`}>
                                    {msg.text}
                                </div>
                                <div className={`text-[10px] mt-1 opacity-60 flex gap-1 ${msg.role === 'user' ? 'justify-end text-sky-200' : 'justify-start text-slate-500 ml-1'}`}>
                                   <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                   {msg.role === 'user' && <span>✓✓</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Animated Typing Indicator */}
                    {isTyping && (
                        <div className="flex w-full gap-3 animate-fade-in-up">
                            <Avatar role="model" className="mt-auto mb-1" />
                            <div className="bg-slate-800 text-slate-400 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2 shadow-sm">
                                <div className="flex gap-1 h-2 items-center">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area - Fixed Bottom for Full Screen Feel */}
            <div className="shrink-0 p-3 md:p-4 bg-slate-900 border-t border-white/5 relative z-20 pb-safe">
                <div className="max-w-4xl mx-auto flex gap-2 items-end">
                     <div className="flex-1 bg-black/40 border border-slate-700 focus-within:border-sky-500 rounded-2xl flex items-center min-h-[50px] transition-colors focus-within:bg-black/60">
                        <Textarea 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Message..."
                            className="bg-transparent border-none shadow-none focus:ring-0 resize-none min-h-[50px] max-h-[120px] py-3 px-4 text-sm md:text-base leading-relaxed"
                        />
                     </div>
                     <Button 
                        onClick={handleSend} 
                        disabled={!input.trim() || isTyping || isSending}
                        className={`w-12 h-12 p-0 rounded-full shrink-0 bg-sky-500 hover:bg-sky-400 flex items-center justify-center shadow-lg transition-all duration-300 overflow-hidden ${isSending ? 'scale-90 bg-emerald-500' : 'scale-100'}`}
                    >
                         {/* Neon Particles on Send */}
                        {isSending && particles.map((p, i) => {
                            const tx = Math.cos(p.angle * Math.PI / 180) * p.dist;
                            const ty = Math.sin(p.angle * Math.PI / 180) * p.dist;
                            return (
                                <div 
                                    key={i}
                                    className="absolute left-1/2 top-1/2 bg-white rounded-full animate-particle-out pointer-events-none"
                                    style={{
                                        width: p.size,
                                        height: p.size,
                                        '--tx': `${tx}px`,
                                        '--ty': `${ty}px`
                                    } as React.CSSProperties}
                                />
                            );
                        })}
                        
                        <div className={`transition-all duration-300 transform ${isSending ? 'translate-x-8 -translate-y-8 opacity-0' : 'translate-0 opacity-100'}`}>
                            <svg className="w-5 h-5 text-white transform rotate-0 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;