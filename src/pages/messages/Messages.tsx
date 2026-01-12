import { useState, useEffect, useRef } from 'react';
import { Search, Phone, Video, MoreVertical, Send, Mic } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { chatService, type ChatPreview } from '../../services/chatService';
import { userService } from '../../services/userService';
import { type ChatMessage } from '../../types';
import { MOCK_CHATS_DATA, MOCK_MESSAGES_DATA } from '../../services/mockChatData';

export default function Messages() {
    const { user } = useAuth();
    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Subscribe to Chats - or use Mock if empty/error
    useEffect(() => {
        // NOTE: For UI Verification, we will mix real and mock data or fallback to mock
        if (!user) {
            // Demo mode if no user (should rely on auth context, but for dev safety)
            setChats(MOCK_CHATS_DATA);
            if (!selectedChat) setSelectedChat(MOCK_CHATS_DATA[0]);
            return;
        }

        const unsubscribe = chatService.subscribeToChats(user.uid, async (chatList) => {
            if (chatList.length === 0) {
                setChats(MOCK_CHATS_DATA);
                if (!selectedChat) setSelectedChat(MOCK_CHATS_DATA[0]);
                return;
            }

            // Enrich chats with other user data
            const enriched = await Promise.all(chatList.map(async (chat) => {
                const otherId = chat.participants.find(p => p !== user.uid);
                let otherUser = undefined;
                if (otherId) {
                    try {
                        const userProfile = await userService.getUserProfile(otherId);
                        if (userProfile) {
                            otherUser = {
                                uid: userProfile.uid,
                                displayName: userProfile.displayName,
                                photoURL: userProfile.photoURL
                            };
                        }
                    } catch (e) {
                        console.error("Error fetching chat user", e);
                    }
                }
                return { ...chat, otherUser };
            }));
            setChats(enriched);
            if (!selectedChat && enriched.length > 0) {
                setSelectedChat(enriched[0]);
            }
        });
        return () => unsubscribe();
    }, [user]);

    // Subscribe to Messages
    useEffect(() => {
        if (!selectedChat) return;

        // Check if it's a mock chat
        if (MOCK_MESSAGES_DATA[selectedChat.id]) {
            setMessages(MOCK_MESSAGES_DATA[selectedChat.id]);
            // Scroll to bottom
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            return;
        }

        const unsubscribe = chatService.subscribeToMessages(selectedChat.id, (msgs) => {
            setMessages(msgs);
            // Scroll to bottom
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
        return () => unsubscribe();
    }, [selectedChat]);

    const handleSend = async () => {
        if (!inputText.trim() || !selectedChat || !user) return;
        try {
            await chatService.sendMessage(selectedChat.id, inputText, user.uid);
            setInputText("");
        } catch (error) {
            console.error("Error sending message", error);
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!user && chats.length === 0) {
        // Fallback for initial render if Effect hasn't run yet but user is null
        // However, useEffect above handles setting mock data.
        // We just don't want to return null.
    }

    return (
        <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)] flex flex-col md:flex-row bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm mt-2 md:mt-0">
            {/* Sidebar List */}
            <div className="w-full md:w-80 border-r border-white/5 flex flex-col bg-black/20">
                <div className="p-4 border-b border-white/5">
                    <h2 className="font-heading font-bold text-lg text-white mb-4">Mensajes</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar chats..." className="pl-10 bg-white/5 border-white/5 focus-visible:ring-brand-yellow/50" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {chats.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No tienes conversaciones activas.
                        </div>
                    )}
                    {chats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={cn(
                                "p-4 cursor-pointer flex gap-3 items-center border-b border-white/5 transition-all hover:bg-white/5",
                                selectedChat?.id === chat.id ? "bg-white/5 border-l-4 border-l-brand-yellow" : "border-l-4 border-l-transparent"
                            )}
                        >
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg overflow-hidden bg-brand-charcoal")}>
                                {chat.otherUser?.photoURL ?
                                    <img src={chat.otherUser.photoURL} alt="Avatar" className="w-full h-full object-cover" /> :
                                    <span>{chat.otherUser?.displayName?.substring(0, 2).toUpperCase() || 'U'}</span>
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className={cn("font-bold text-sm truncate text-gray-200")}>
                                        {chat.otherUser?.displayName || "Usuario Desconocido"}
                                    </h4>
                                    <span className="text-[10px] text-muted-foreground">
                                        {chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : ''}
                                    </span>
                                </div>
                                <p className="text-xs truncate text-muted-foreground">
                                    {chat.lastMessage?.text || "Nuevo chat"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            {selectedChat ? (
                <div className="hidden md:flex flex-1 flex-col bg-gradient-to-br from-black to-brand-petrol/5 relative">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm bg-zinc-800 overflow-hidden">
                                {selectedChat.otherUser?.photoURL ?
                                    <img src={selectedChat.otherUser.photoURL} alt="Avatar" className="w-full h-full object-cover" /> :
                                    <span>{selectedChat.otherUser?.displayName?.substring(0, 2).toUpperCase() || 'U'}</span>
                                }
                            </div>
                            <div>
                                <h3 className="font-heading font-bold text-white text-sm">
                                    {selectedChat.otherUser?.displayName || "Chat"}
                                </h3>
                                <p className="text-[10px] flex items-center gap-1.5 font-medium text-brand-yellow">
                                    En línea
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
                                    (msg.senderId === user?.uid || msg.senderId === 'current_user')
                                        ? "self-end bg-brand-yellow text-brand-black rounded-tr-sm shadow-[0_0_15px_rgba(255,216,77,0.3)] font-medium"
                                        : "self-start bg-brand-charcoal text-gray-200 rounded-tl-sm border border-white/5"
                                )}
                            >
                                {msg.text}
                                <span className="block text-[10px] opacity-50 mt-1 text-right">{formatTime(msg.timestamp)}</span>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-brand-black/95 border-t border-white/5 backdrop-blur-md">
                        <div className="flex gap-3 items-end bg-brand-charcoal p-2 rounded-xl border border-white/10 focus-within:border-brand-yellow/30 transition-all">
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
                                className="h-10 w-10 rounded-lg shrink-0 bg-brand-yellow text-brand-black hover:bg-brand-warm"
                                onClick={handleSend}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-black/20 text-muted-foreground">
                    Selecciona un chat para comenzar
                </div>
            )}
        </div>
    );
}
