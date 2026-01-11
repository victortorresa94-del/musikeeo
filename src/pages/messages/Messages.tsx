import { useState } from 'react';
import { Search, Phone, Video, MoreVertical, Send, Sparkles, Bot, Mic } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const MOCK_CHATS = [
    { id: 1, name: 'Sonic Wave Studio', status: 'online', time: '12:30', lastMsg: 'Confirmada la sesión del jueves.', unread: 0, avatar: 'SW', color: 'bg-brand-petrol' },
    { id: 2, name: 'Ana Singer', status: 'offline', time: 'ayer', lastMsg: '¿Tienes disponible esa fecha?', unread: 2, avatar: 'AS', color: 'bg-purple-600' },
    { id: 3, name: 'Sala Apolo', status: 'online', time: 'lun', lastMsg: 'Te enviamos el rider técnico.', unread: 0, avatar: 'SA', color: 'bg-brand-lime text-black' },
];

const MOCK_MESSAGES = [
    { id: 1, sender: 'them', text: 'Hola, ¿cómo va todo? Quería confirmar la reserva para este jueves.', time: '12:20' },
    { id: 2, sender: 'me', text: '¡Hola! Todo bien. Sí, confirmamos jueves de 10:00 a 14:00.', time: '12:25' },
    { id: 3, sender: 'them', text: 'Perfecto. ¿Necesitas alquiler de amplis?', time: '12:26' },
];

export default function Messages() {
    const [selectedChat, setSelectedChat] = useState(MOCK_CHATS[0]);
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [inputText, setInputText] = useState("");

    const handleSend = () => {
        if (!inputText.trim()) return;
        setMessages([...messages, { id: Date.now(), sender: 'me', text: inputText, time: 'Ahora' }]);
        setInputText("");
    };

    return (
        <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)] flex flex-col md:flex-row bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm mt-2 md:mt-0">
            {/* Sidebar List */}
            <div className="w-full md:w-80 border-r border-white/5 flex flex-col bg-black/20">
                <div className="p-4 border-b border-white/5">
                    <h2 className="font-heading font-bold text-lg text-white mb-4">Mensajes</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar chats..." className="pl-10 bg-white/5 border-white/5 focus-visible:ring-brand-cyan/50" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {MOCK_CHATS.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={cn(
                                "p-4 cursor-pointer flex gap-3 items-center border-b border-white/5 transition-all hover:bg-white/5",
                                selectedChat.id === chat.id ? "bg-white/5 border-l-4 border-l-brand-cyan" : "border-l-4 border-l-transparent"
                            )}
                        >
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg", chat.color)}>
                                {chat.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className={cn("font-bold text-sm truncate", chat.unread > 0 ? "text-white" : "text-gray-300")}>
                                        {chat.name}
                                    </h4>
                                    <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                                </div>
                                <p className={cn("text-xs truncate", chat.unread > 0 ? "text-brand-cyan font-medium" : "text-muted-foreground")}>
                                    {chat.lastMsg}
                                </p>
                            </div>
                            {chat.unread > 0 && (
                                <div className="h-5 w-5 bg-brand-lime rounded-full flex items-center justify-center text-[10px] font-bold text-black shadow-glow-lime">
                                    {chat.unread}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="hidden md:flex flex-1 flex-col bg-gradient-to-br from-black to-brand-petrol/5 relative">
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm", selectedChat.color)}>
                            {selectedChat.avatar}
                        </div>
                        <div>
                            <h3 className="font-heading font-bold text-white text-sm">{selectedChat.name}</h3>
                            <p className="text-[10px] flex items-center gap-1.5 font-medium">
                                <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", selectedChat.status === 'online' ? "bg-brand-lime shadow-[0_0_5px_#82FF1F]" : "bg-gray-500")}></span>
                                <span className={selectedChat.status === 'online' ? "text-brand-lime" : "text-gray-500"}>
                                    {selectedChat.status === 'online' ? 'En línea' : 'Desconectado'}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/10"><Phone className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/10"><Video className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/10"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 scroll-smooth">
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={msg.id}
                            className={cn("max-w-[75%] rounded-2xl p-4 text-sm relative group",
                                msg.sender === 'me'
                                    ? "self-end bg-brand-petrol text-white rounded-tr-sm shadow-[0_0_15px_rgba(0,92,138,0.3)]"
                                    : "self-start bg-white/5 text-gray-200 rounded-tl-sm border border-white/5"
                            )}
                        >
                            {msg.text}
                            <span className="block text-[10px] opacity-50 mt-1 text-right">{msg.time}</span>
                        </motion.div>
                    ))}

                    {/* AI Suggestion Chip */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="self-center mt-4"
                    >
                        <div className="flex items-center gap-2 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full px-3 py-1 cursor-pointer hover:bg-brand-cyan/20 transition-colors group">
                            <Bot className="h-3 w-3 text-brand-cyan" />
                            <span className="text-xs text-brand-cyan font-medium group-hover:underline">Sugerencia: Confirmarrider técnico</span>
                            <Sparkles className="h-3 w-3 text-brand-lime" />
                        </div>
                    </motion.div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md">
                    <div className="flex gap-3 items-end bg-white/5 p-2 rounded-2xl border border-white/10 focus-within:border-brand-cyan/30 transition-all">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 shrink-0">
                            <Mic className="h-5 w-5" />
                        </Button>
                        <div className="flex-1">
                            <Input
                                placeholder="Escribe un mensaje..."
                                className="bg-transparent border-none focus-visible:ring-0 px-0 h-10 text-white placeholder:text-muted-foreground"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                        </div>
                        <Button
                            variant="glow"
                            size="icon"
                            className="h-10 w-10 rounded-xl shrink-0"
                            onClick={handleSend}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
