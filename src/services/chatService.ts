import {
    collection,
    query,
    where,
    orderBy,
    addDoc,
    updateDoc,
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type ChatMessage } from '../types';

export interface ChatPreview {
    id: string;
    participants: string[];
    lastMessage?: {
        text: string;
        senderId: string;
        timestamp: number;
    };
    updatedAt: number;
    unreadCount?: number; // Calculated locally or stored
    otherUser?: {
        uid: string;
        displayName: string;
        photoURL?: string;
    };
}

export const chatService = {
    // Listen to user's chats
    subscribeToChats: (userId: string, callback: (chats: ChatPreview[]) => void) => {
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', userId)
            // orderBy removed to avoid needing composite index
        );

        return onSnapshot(q, (snapshot) => {
            const chats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ChatPreview[];
            // Client-side sort
            chats.sort((a, b) => b.updatedAt - a.updatedAt);
            callback(chats);
        }, (error) => {
            console.error("Error fetching chats:", error);
            // Return empty on error to trigger fallback in UI
            callback([]);
        });
    },

    // Listen to messages in a chat (last 100, chronological order in UI)
    subscribeToMessages: (chatId: string, callback: (messages: ChatMessage[]) => void) => {
        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ChatMessage[];
            callback(messages.reverse());
        });
    },

    // Send a message
    sendMessage: async (chatId: string, text: string, senderId: string) => {
        // 1. Add message to subcollection
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            text,
            senderId,
            timestamp: Date.now(),
            read: false
        });

        // 2. Update last message on chat doc
        await updateDoc(doc(db, 'chats', chatId), {
            lastMessage: {
                text,
                senderId,
                timestamp: Date.now()
            },
            updatedAt: Date.now()
        });
    },

    // Start or get existing chat — idempotent: deterministic doc ID from sorted participants
    // prevents the race where two simultaneous opens create two chats for the same pair.
    createChat: async (currentUserId: string, targetUserId: string) => {
        if (currentUserId === targetUserId) {
            throw new Error("Cannot create a chat with yourself");
        }

        const chatId = [currentUserId, targetUserId].sort().join('_');
        const chatRef = doc(db, 'chats', chatId);

        // Try to read first; if exists, return its ID directly (cheap, one read)
        const existing = await getDoc(chatRef);
        if (existing.exists()) return chatId;

        // Create with merge=true so concurrent calls converge to the same doc
        await setDoc(chatRef, {
            participants: [currentUserId, targetUserId],
            updatedAt: Date.now(),
            createdAt: serverTimestamp()
        }, { merge: true });

        return chatId;
    }
};
