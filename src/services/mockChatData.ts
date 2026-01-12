
import { type ChatMessage } from '../types';
import { type ChatPreview } from './chatService';

export const MOCK_CHATS_DATA: ChatPreview[] = [
    {
        id: 'chat_1',
        participants: ['current_user', 'user_2'],
        updatedAt: Date.now(),
        lastMessage: {
            text: "¡Genial! Nos vemos el sábado en el ensayo.",
            senderId: 'current_user',
            timestamp: Date.now() - 1000 * 60 * 5 // 5 min ago
        },
        otherUser: {
            uid: 'user_2',
            displayName: 'Ana Vocals',
            photoURL: 'https://i.pravatar.cc/150?u=2'
        },
        unreadCount: 0
    },
    {
        id: 'chat_2',
        participants: ['current_user', 'user_1'],
        updatedAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
        lastMessage: {
            text: "¿Sigues buscando bajista para el bolo?",
            senderId: 'user_1',
            timestamp: Date.now() - 1000 * 60 * 60
        },
        otherUser: {
            uid: 'user_1',
            displayName: 'Lucas Guitar',
            photoURL: 'https://i.pravatar.cc/150?u=1'
        },
        unreadCount: 2
    },
    {
        id: 'chat_3',
        participants: ['current_user', 'studio_1'],
        updatedAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        lastMessage: {
            text: "Os envío el presupuesto modificado.",
            senderId: 'studio_1',
            timestamp: Date.now() - 1000 * 60 * 60 * 24
        },
        otherUser: {
            uid: 'studio_1',
            displayName: 'Sonic Studios',
            photoURL: 'https://i.pravatar.cc/150?u=sonic'
        },
        unreadCount: 0
    }
];

export const MOCK_MESSAGES_DATA: Record<string, ChatMessage[]> = {
    'chat_1': [
        {
            id: 'm1',
            text: "Hola! He visto que buscas una cantante para el proyecto de Soul.",
            senderId: 'user_2',
            timestamp: Date.now() - 1000 * 60 * 60 * 2,
            read: true
        },
        {
            id: 'm2',
            text: "Sí! Justo estamos cerrando la banda. ¿Tienes algo grabado?",
            senderId: 'current_user',
            timestamp: Date.now() - 1000 * 60 * 60 * 1.9,
            read: true
        },
        {
            id: 'm3',
            text: "Claro, aquí tienes mi último reel.",
            senderId: 'user_2',
            timestamp: Date.now() - 1000 * 60 * 60 * 1.8,
            read: true
        },
        {
            id: 'm4',
            text: "Suena increíble Ana. ¿Qué disponibilidad tienes para ensayar?",
            senderId: 'current_user',
            timestamp: Date.now() - 1000 * 60 * 60 * 0.5,
            read: true
        },
        {
            id: 'm5',
            text: "Los martes y jueves por la tarde me va perfecto.",
            senderId: 'user_2',
            timestamp: Date.now() - 1000 * 60 * 10,
            read: true
        },
        {
            id: 'm6',
            text: "¡Genial! Nos vemos el sábado en el ensayo.",
            senderId: 'current_user',
            timestamp: Date.now() - 1000 * 60 * 5,
            read: true
        }
    ],
    'chat_2': [
        {
            id: 'm2_1',
            text: "Buenas! Vi tu anuncio del bolo en Gràcia.",
            senderId: 'user_1',
            timestamp: Date.now() - 1000 * 60 * 90,
            read: true
        },
        {
            id: 'm2_2',
            text: "¿Sigues buscando bajista para el bolo?",
            senderId: 'user_1',
            timestamp: Date.now() - 1000 * 60 * 60,
            read: false
        }
    ]
};
