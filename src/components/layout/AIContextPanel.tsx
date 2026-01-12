import { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../../services/aiService';

interface AIContextPanelProps {
    isOpen?: boolean;
}

interface Message {
    role: 'user' | 'ai';
    content: string;
}

export const AIContextPanel = ({ isOpen = true }: AIContextPanelProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await aiService.chat(userMsg.content);
            const aiMsg: Message = { role: 'ai', content: response };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI error", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="hidden lg:flex flex-col border-l border-white/5 bg-background/50 h-screen sticky top-0 backdrop-blur-sm overflow-hidden"
                >
                    <div className="w-80 flex flex-col h-full">
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-brand-lime">
                                <Bot className="h-5 w-5" />
                                <span className="font-heading font-bold tracking-wide">AI Assistant</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-lime"></span>
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">Gemini Pro</span>
                            </div>
                        </div>

                        {/* Chat Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                            {messages.length === 0 && (
                                <Card className="bg-white/5 border-brand-lime/20 mb-4">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-brand-lime">
                                            <Sparkles className="h-4 w-4" />
                                            Sugerencia
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        ¡Hola! Soy tu asistente potenciado por Google Gemini. Puedo ayudarte a crear eventos, buscar músicos o redactar tu bio. ¿Qué necesitas hoy?
                                    </CardContent>
                                </Card>
                            )}

                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-brand-cyan' : 'bg-brand-petrol'}`}>
                                        {msg.role === 'user' ? <span className="text-xs font-bold text-black">YO</span> : <Bot className="h-4 w-4 text-white" />}
                                    </div>
                                    <div className={`max-w-[80%] rounded-2xl p-3 text-xs border ${msg.role === 'user'
                                        ? 'bg-brand-cyan/10 border-brand-cyan/20 text-white rounded-tr-none'
                                        : 'bg-white/5 border-white/5 text-gray-300 rounded-tl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-2">
                                    <div className="h-8 w-8 rounded-full bg-brand-petrol flex items-center justify-center shrink-0">
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-brand-lime rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-brand-lime rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-brand-lime rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={endOfMessagesRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/5 shrink-0 bg-background/50 backdrop-blur-sm">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-lime/50 transition-colors placeholder:text-muted-foreground"
                                    placeholder="Escribe algo..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    disabled={isLoading}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={isLoading || !inputValue.trim()}
                                    className="bg-brand-lime text-black hover:bg-brand-lime/90 shrink-0"
                                >
                                    <Sparkles className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
};
