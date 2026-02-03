import { useState, useEffect, useRef } from 'react';
import { X, ArrowUp, Mic, Music, Search, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    generateResponse,
    createInitialState,
    RODRIGO_INITIAL_MESSAGE
} from '../../lib/rodrigoEngine';
import type { ConversationState, ParsedResponse } from '../../lib/rodrigoEngine';
import { ArtistRecommendations, BoloRecommendations } from './ArtistRecommendation';

const RODRIGO_AVATAR = '/rodrigo-persona.png';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    parsedContent?: ParsedResponse;
}

const QUICK_ACTIONS = [
    { icon: Search, label: 'Buscar músicos', prompt: 'Quiero buscar músicos para un evento' },
    { icon: Music, label: 'Soy músico', prompt: 'Soy músico y busco bolos' },
    { icon: Calendar, label: 'Crear evento', prompt: 'Quiero crear un evento' },
];

export const RodrigoFloatingChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [conversationState, setConversationState] = useState<ConversationState>(createInitialState());
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: RODRIGO_INITIAL_MESSAGE,
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Save/restore chat state from sessionStorage
    useEffect(() => {
        const savedMessages = sessionStorage.getItem('rodrigo_chat_messages');
        const savedState = sessionStorage.getItem('rodrigo_chat_state');
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
            } catch (e) {
                console.error('Failed to parse chat messages', e);
            }
        }
        if (savedState) {
            try {
                setConversationState(JSON.parse(savedState));
            } catch (e) {
                console.error('Failed to parse chat state', e);
            }
        }
    }, []);

    useEffect(() => {
        if (messages.length > 1) {
            sessionStorage.setItem('rodrigo_chat_messages', JSON.stringify(messages));
            sessionStorage.setItem('rodrigo_chat_state', JSON.stringify(conversationState));
        }
    }, [messages, conversationState]);

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Generate response using DeepSeek
            const { response, newState } = await generateResponse(content, conversationState);
            setConversationState(newState);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.text,
                timestamp: new Date(),
                parsedContent: response,
            };

            setMessages(prev => [...prev, aiMessage]);

            // Handle Event Publication Handoff
            if (response.publishEvent) {
                // Short delay to let the user read the confirmation
                setTimeout(() => {
                    navigate('/eventos/crear', {
                        state: { eventDraft: response.publishEvent }
                    });
                    setIsOpen(false);
                }, 2000);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Perdona, he tenido un problema técnico. ¿Puedes repetirme qué necesitas?',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleQuickAction = (prompt: string) => {
        sendMessage(prompt);
    };

    // Don't show on Rodrigo landing page (it has its own chat)
    if (location.pathname === '/rodrigo') {
        return null;
    }

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFD84D] text-black shadow-[0_4px_20px_rgba(250,208,56,0.4)] transition-transform hover:scale-110 active:scale-95 overflow-hidden border-2 border-[#FFD84D]"
                        title="Habla con Rodrigo"
                    >
                        <img src={RODRIGO_AVATAR} alt="Rodrigo" className="w-full h-full object-cover" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-[#0A0A0A]">
                            <div className="relative">
                                <div
                                    className="size-10 rounded-full bg-cover bg-center border border-white/10"
                                    style={{ backgroundImage: `url(${RODRIGO_AVATAR})` }}
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-500 rounded-full border-2 border-[#0A0A0A]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-white">Rodrigo</h3>
                                <p className="text-xs text-[#FFD84D] font-medium">ONLINE</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0A0A0A]">
                            {messages.map((message) => (
                                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                    {message.role === 'assistant' && (
                                        <div
                                            className="size-8 rounded-full bg-cover bg-center shrink-0 border border-white/10"
                                            style={{ backgroundImage: `url(${RODRIGO_AVATAR})` }}
                                        />
                                    )}
                                    <div className={`max-w-[85%] ${message.role === 'user' ? '' : ''}`}>
                                        <div className={`px-4 py-3 rounded-2xl text-sm ${message.role === 'user'
                                            ? 'bg-[#262626] border border-white/5 rounded-br-sm text-white'
                                            : 'bg-[#1A1A1A] border border-white/5 rounded-bl-sm text-gray-100'
                                            }`}>
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        </div>

                                        {/* Artist Recommendations */}
                                        {message.parsedContent?.artists && message.parsedContent.artists.length > 0 && (
                                            <ArtistRecommendations artists={message.parsedContent.artists} />
                                        )}

                                        {/* Bolo Opportunities */}
                                        {message.parsedContent?.bolos && message.parsedContent.bolos.length > 0 && (
                                            <BoloRecommendations bolos={message.parsedContent.bolos} />
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {isTyping && (
                                <div className="flex gap-3">
                                    <div
                                        className="size-8 rounded-full bg-cover bg-center shrink-0 border border-white/10"
                                        style={{ backgroundImage: `url(${RODRIGO_AVATAR})` }}
                                    />
                                    <div className="flex items-center gap-1 px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-2xl rounded-bl-sm">
                                        <span className="text-sm text-[#FFD84D] animate-pulse">Rodrigo está escribiendo...</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        <div className="px-4 pb-2 flex flex-wrap gap-2 border-t border-white/5 pt-3 bg-[#0A0A0A]">
                            {QUICK_ACTIONS.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickAction(action.prompt)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1A1A] border border-white/10 text-xs text-gray-300 hover:border-[#FFD84D]/50 hover:text-white transition-colors"
                                >
                                    <action.icon size={12} className="text-[#FFD84D]" />
                                    {action.label}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10 bg-[#0A0A0A]">
                            <div className="flex gap-2 items-end">
                                <div className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-xl flex items-center focus-within:border-[#FFD84D]/50 transition-colors">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                                        placeholder="Escríbele a Rodrigo..."
                                        className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none"
                                        disabled={isTyping}
                                    />
                                    <button className="p-3 text-gray-400 hover:text-white transition-colors">
                                        <Mic size={18} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={isTyping || !input.trim()}
                                    className="h-12 w-12 flex items-center justify-center bg-[#FFD84D] text-black rounded-xl hover:bg-[#ffe066] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ArrowUp size={20} />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 text-center mt-2">
                                Rodrigo AI puede cometer errores. Verifica la información importante.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
