import {
    collection,
    query,
    where,
    orderBy,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    serverTimestamp,
    getDocs,
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

    // Listen to messages in a chat
    subscribeToMessages: (chatId: string, callback: (messages: ChatMessage[]) => void) => {
        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('timestamp', 'asc'),
            limit(100)
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ChatMessage[];
            callback(messages);
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

    // Start or get existing chat
    createChat: async (currentUserId: string, targetUserId: string) => {
        // Check if chat already exists
        // (For MVP we might just create new or suboptimal query)
        // Ideally we keep a composite ID or query for both participants

        // Simple hack: Check common chats (client-side filter for MVP robustness or complex query)
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', currentUserId)
        );

        const snapshot = await getDocs(q);
        const existing = snapshot.docs.find(d => {
            const data = d.data();
            return data.participants.includes(targetUserId);
        });

        if (existing) return existing.id;

        // Create new
        const docRef = await addDoc(collection(db, 'chats'), {
            participants: [currentUserId, targetUserId],
            updatedAt: Date.now(),
            createdAt: serverTimestamp()
        });

        return docRef.id;
    }
};
