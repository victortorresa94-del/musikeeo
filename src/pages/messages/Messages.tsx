import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Phone, Video, MoreVertical, Send, Mic, ArrowLeft } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { chatService, type ChatPreview } from '../../services/chatService';
import { userService } from '../../services/userService';
import { type ChatMessage } from '../../types';

export default function Messages() {
    const { user } = useAuth();
    const location = useLocation();
    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

    // Handle navigation from other pages with a pre-selected chat
    useEffect(() => {
        if (location.state?.selectedChatId && chats.length > 0) {
            const target = chats.find(c => c.id === location.state.selectedChatId);
            if (target) {
                setSelectedChat(target);
                setMobileView('chat');
            }
        }
    }, [location.state, chats]);

    // Subscribe to Chats
    useEffect(() => {
        if (!user) return;

        const unsubscribe = chatService.subscribeToChats(user.uid, async (chatList) => {
            if (chatList.length === 0) {
                setChats([]);
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

            // If no chat selected, and we have a target from navigation, it will be handled by the other effect.
            // If no target `state`, maybe we don't auto-select to keep it clean, or select latest.
            // For now, let's NOT auto-select the first one unless we want to.
            // But let's keep the behavior if we are not navigating.
            if (!location.state?.selectedChatId && !selectedChat && enriched.length > 0) {
                // Optional: Auto-select latest
                // setSelectedChat(enriched[0]);
            }
        });
        return () => unsubscribe();
    }, [user, location.state]);

    // Subscribe to Messages
    useEffect(() => {
        if (!selectedChat) return;

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
        <div className="bg-background h-screen flex overflow-hidden">
            {/* Sidebar List */}
            <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-80 border-r border-border flex-col bg-background`}>
                <div className="p-4 border-b border-border">
                    <h2 className="font-heading font-bold text-lg text-foreground mb-4">Mensajes</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar chats..." className="pl-10 bg-muted rounded-xl border border-border h-10 focus-visible:ring-primary/50" />
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
                            onClick={() => { setSelectedChat(chat); setMobileView('chat'); }}
                            className={cn(
                                "p-4 cursor-pointer flex gap-3 items-center border-b border-border transition-colors hover:bg-muted/60",
                                selectedChat?.id === chat.id
                                    ? "bg-primary/5 border-l-2 border-l-primary"
                                    : "border-l-2 border-l-transparent"
                            )}
                        >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden bg-muted shrink-0">
                                {chat.otherUser?.photoURL ?
                                    <img src={chat.otherUser.photoURL} alt="Avatar" className="w-full h-full object-cover" /> :
                                    <span>{chat.otherUser?.displayName?.substring(0, 2).toUpperCase() || 'U'}</span>
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h4 className="text-sm font-semibold text-foreground truncate">
                                        {chat.otherUser?.displayName || "Usuario Desconocido"}
                                    </h4>
                                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                        {chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : ''}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {chat.lastMessage?.text || "Nuevo chat"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            {selectedChat ? (
                <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-background relative`}>
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-background">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setMobileView('list')} className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-muted overflow-hidden shrink-0">
                                {selectedChat.otherUser?.photoURL ?
                                    <img src={selectedChat.otherUser.photoURL} alt="Avatar" className="w-full h-full object-cover" /> :
                                    <span>{selectedChat.otherUser?.displayName?.substring(0, 2).toUpperCase() || 'U'}</span>
                                }
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground text-sm">
                                    {selectedChat.otherUser?.displayName || "Chat"}
                                </h3>
                                <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                                    En línea
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"><Phone className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"><Video className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"><MoreVertical className="h-4 w-4" /></Button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 px-6 py-4 overflow-y-auto flex flex-col gap-4 scroll-smooth bg-background">
                        {messages.map((msg) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={msg.id}
                                className={cn("flex flex-col",
                                    (msg.senderId === user?.uid || msg.senderId === 'current_user')
                                        ? "items-end"
                                        : "items-start"
                                )}
                            >
                                <div className={cn(
                                    "px-4 py-2.5 text-sm max-w-[75%]",
                                    (msg.senderId === user?.uid || msg.senderId === 'current_user')
                                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm ml-auto"
                                        : "bg-muted text-foreground rounded-2xl rounded-bl-sm"
                                )}>
                                    {msg.text}
                                </div>
                                <span className="text-xs text-muted-foreground mt-1">{formatTime(msg.timestamp)}</span>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-background border-t border-border">
                        <div className="flex gap-3 items-center">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted shrink-0">
                                <Mic className="h-5 w-5" />
                            </Button>
                            <Input
                                placeholder="Escribe un mensaje..."
                                className="flex-1 bg-muted rounded-xl border border-border h-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <Button
                                size="icon"
                                className="h-10 w-10 rounded-xl shrink-0 bg-primary text-primary-foreground hover:brightness-105"
                                onClick={handleSend}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex flex-1 items-center justify-center bg-background text-muted-foreground`}>
                    Selecciona un chat para comenzar
                </div>
            )}
        </div>
    );
}
